import { z } from 'zod'
import { useDatabase } from '../../database/index'
import { messages, recruiters } from '../../database/schema'
import { eq, and } from 'drizzle-orm'
import { getTelegramClient, loadSetting } from '../../utils/telegram-client'

const schema = z.object({
  recruiterId: z.number().int().positive(),
  vacancyId: z.number().int().positive(),
  telegramUsername: z.string().regex(
    /^(@?[A-Za-z0-9_]{5,32}|\+?[0-9]{7,15})$/,
    'Invalid Telegram username or phone number'
  ),
  force: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Invalid input' })
  }

  const { recruiterId, vacancyId, telegramUsername, force } = parsed.data

  // Guard: require an active Telegram session before attempting sync
  const sessionStr = loadSetting('telegram_session')
  if (!sessionStr) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Telegram is not authenticated. Complete setup via /api/integrations/telegram/auth'
    })
  }

  const db = useDatabase()

  // Validate recruiter belongs to the given vacancy
  const [recruiter] = db
    .select({ id: recruiters.id, tgSyncedAt: recruiters.tgSyncedAt })
    .from(recruiters)
    .where(and(eq(recruiters.id, recruiterId), eq(recruiters.vacancyId, vacancyId)))
    .all()

  if (!recruiter) {
    throw createError({ statusCode: 400, statusMessage: 'Recruiter does not belong to this vacancy' })
  }

  // Normalize: strip @, add + prefix for phone numbers (digits only)
  const isPhone = /^[0-9]{7,15}$/.test(telegramUsername.replace('+', ''))
  const username = isPhone
    ? (telegramUsername.startsWith('+') ? telegramUsername : `+${telegramUsername}`)
    : telegramUsername.replace('@', '')
  const tgSyncedAt = (!force && recruiter.tgSyncedAt) ? new Date(recruiter.tgSyncedAt) : null

  let client: Awaited<ReturnType<typeof getTelegramClient>>['client']
  try {
    ;({ client } = await getTelegramClient())
  } catch (err) {
    console.error('[telegram/sync] client init failed:', err)
    throw createError({ statusCode: 503, statusMessage: 'Telegram client unavailable' })
  }

  // Fetch messages from the dialog.
  // First sync: get last 200 messages.
  // Incremental sync: get last 200 then filter client-side to only keep newer ones.
  // GramJS getMessages returns messages in reverse-chronological order (newest first).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawMessages: any[]
  try {
    rawMessages = await client.getMessages(username, { limit: 200 })
  } catch (err) {
    console.error('[telegram/sync] getMessages failed:', err)
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch Telegram messages' })
  }

  // Fetch existing dedup keys for this recruiter to avoid duplicate inserts
  const existing = db
    .select({ sentAt: messages.sentAt, content: messages.content })
    .from(messages)
    .where(and(eq(messages.recruiterId, recruiterId), eq(messages.source, 'telegram')))
    .all()

  const existingKeys = new Set(existing.map(m => `${m.sentAt}::${m.content}`))

  let imported = 0
  let total = 0

  for (const msg of rawMessages) {
    // GramJS message objects: msg.date is a Unix timestamp (seconds), msg.message is the text.
    // msg.out === true means the message was sent by the authenticated user.
    const text: string = msg.message ?? ''
    const msgDate = new Date((msg.date as number) * 1000)

    // For incremental sync: skip messages older than or equal to last sync timestamp
    if (tgSyncedAt && msgDate <= tgSyncedAt) continue

    const sentAt = msgDate.toISOString()

    if (text.trim()) {
      total++
      const key = `${sentAt}::${text}`
      if (!existingKeys.has(key)) {
        db.insert(messages).values({
          vacancyId,
          recruiterId,
          source: 'telegram',
          direction: msg.out ? 'out' : 'in',
          content: text,
          sentAt
        }).run()
        existingKeys.add(key)
        imported++
      }
    }

    // Import chosen reactions (emoji the authenticated user placed on this message).
    // GramJS uses chosenOrder (TL flag) to mark the current user's reaction — not a boolean `chosen`.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chosenReactions: string[] = (msg.reactions?.results ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((r: any) => r.chosen === true || r.chosenOrder !== undefined)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any) => r.reaction?.emoticon ?? r.reaction?.documentId?.toString() ?? '?')
      .filter(Boolean)

    for (const emoji of chosenReactions) {
      const reactionKey = `${sentAt}::reaction:${emoji}`
      if (!existingKeys.has(reactionKey)) {
        db.insert(messages).values({
          vacancyId,
          recruiterId,
          source: 'telegram',
          direction: 'out',
          content: emoji,
          sentAt
        }).run()
        existingKeys.add(reactionKey)
        imported++
      }
    }
  }

  // Fetch and store recruiter's Telegram profile photo as base64 data URI
  let tgAvatar: string | null = null
  try {
    const photoBuffer = await client.downloadProfilePhoto(username) as Buffer | null
    if (photoBuffer && photoBuffer.length > 0) {
      tgAvatar = `data:image/jpeg;base64,${photoBuffer.toString('base64')}`
    }
  } catch {
    // Avatar download is best-effort — don't fail the sync
  }

  // Update tg_synced_at and avatar
  db.update(recruiters)
    .set({ tgSyncedAt: new Date().toISOString(), ...(tgAvatar ? { tgAvatar } : {}) })
    .where(eq(recruiters.id, recruiterId))
    .run()

  return { imported, total }
})
