import { z } from 'zod'
import { useDatabase } from '../../database/index'
import { messages, recruiters } from '../../database/schema'
import { eq, and } from 'drizzle-orm'
import { getTelegramClient, loadSetting } from '../../utils/telegram-client'

const schema = z.object({
  recruiterId: z.number().int().positive(),
  vacancyId: z.number().int().positive(),
  telegramUsername: z.string().regex(/^@?[A-Za-z0-9_]{5,32}$/, 'Invalid Telegram username'),
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.errors[0]?.message ?? 'Invalid input' })
  }

  const { recruiterId, vacancyId, telegramUsername } = parsed.data

  // Guard: require an active Telegram session before attempting sync
  const sessionStr = loadSetting('telegram_session')
  if (!sessionStr) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Telegram is not authenticated. Complete setup via /api/integrations/telegram/auth',
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

  const username = telegramUsername.replace('@', '')
  const tgSyncedAt = recruiter.tgSyncedAt ? new Date(recruiter.tgSyncedAt) : null

  let client: Awaited<ReturnType<typeof getTelegramClient>>['client']
  try {
    ;({ client } = await getTelegramClient())
  }
  catch (err) {
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
  }
  catch (err) {
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
    if (!text.trim()) continue

    total++

    // For incremental sync: skip messages older than or equal to last sync timestamp
    const msgDate = new Date((msg.date as number) * 1000)
    if (tgSyncedAt && msgDate <= tgSyncedAt) continue

    const sentAt = msgDate.toISOString()
    const key = `${sentAt}::${text}`
    if (existingKeys.has(key)) continue

    db.insert(messages).values({
      vacancyId,
      recruiterId,
      source: 'telegram',
      direction: msg.out ? 'out' : 'in',
      content: text,
      sentAt,
    }).run()

    existingKeys.add(key)
    imported++
  }

  // Update tg_synced_at to now so next sync only fetches newer messages
  db.update(recruiters)
    .set({ tgSyncedAt: new Date().toISOString() })
    .where(eq(recruiters.id, recruiterId))
    .run()

  return { imported, total }
})
