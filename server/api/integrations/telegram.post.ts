import { z } from 'zod'
import { useDatabase } from '../../database/index'
import { messages, recruiters } from '../../database/schema'
import { eq, and } from 'drizzle-orm'

const schema = z.object({
  recruiterId: z.number().int().positive(),
  vacancyId: z.number().int().positive(),
  telegramUsername: z.string().regex(/^@?[A-Za-z0-9_]{5,32}$/, 'Invalid Telegram username'),
})

/**
 * Expected MCP response message shape.
 * The Telegram MCP HTTP wrapper should return this format.
 */
interface TelegramMessage {
  id: number
  date: string        // ISO 8601
  fromSelf: boolean   // true if sent by us, false if from recruiter
  text: string
}

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.errors[0]?.message ?? 'Invalid input' })
  }

  const { recruiterId, vacancyId, telegramUsername } = parsed.data
  const config = useRuntimeConfig(event)
  const mcpUrl = config.telegramMcpUrl as string | undefined

  if (!mcpUrl) {
    console.error('[telegram] TELEGRAM_MCP_URL is not set')
    throw createError({ statusCode: 503, statusMessage: 'Telegram integration is not available' })
  }

  // Validate recruiter belongs to vacancy
  const db = useDatabase()
  const [recruiter] = db
    .select({ id: recruiters.id })
    .from(recruiters)
    .where(and(eq(recruiters.id, recruiterId), eq(recruiters.vacancyId, vacancyId)))
    .all()

  if (!recruiter) {
    throw createError({ statusCode: 400, statusMessage: 'Recruiter does not belong to this vacancy' })
  }

  // Call Telegram MCP HTTP wrapper
  let telegramMessages: TelegramMessage[]
  try {
    const username = telegramUsername.replace('@', '')
    const response = await $fetch<{ messages: TelegramMessage[] }>(
      `${mcpUrl}/dialog/${encodeURIComponent(username)}`,
      { timeout: 30000 },
    )
    telegramMessages = response.messages ?? []
  }
  catch {
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch Telegram dialog' })
  }

  // Fetch existing telegram messages for this recruiter to dedup
  const existing = db
    .select({ sentAt: messages.sentAt, content: messages.content })
    .from(messages)
    .where(and(eq(messages.recruiterId, recruiterId), eq(messages.source, 'telegram')))
    .all()

  const existingKeys = new Set(existing.map(m => `${m.sentAt}::${m.content}`))

  let imported = 0
  for (const msg of telegramMessages) {
    if (!msg.text?.trim()) continue

    const sentAt = new Date(msg.date).toISOString()
    const key = `${sentAt}::${msg.text}`
    if (existingKeys.has(key)) continue

    db.insert(messages).values({
      vacancyId,
      recruiterId,
      source: 'telegram',
      direction: msg.fromSelf ? 'out' : 'in',
      content: msg.text,
      sentAt,
    }).run()

    existingKeys.add(key)
    imported++
  }

  return { imported, total: telegramMessages.length }
})
