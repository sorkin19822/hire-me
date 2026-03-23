import { z } from 'zod'
import { useDatabase } from '../../database/index'
import { messages, recruiters } from '../../database/schema'
import { eq, and } from 'drizzle-orm'
import { fetchEmailsByAddress } from '../../utils/imap-client'

const schema = z.object({
  recruiterId: z.number().int().positive(),
  vacancyId: z.number().int().positive(),
  email: z.string().email()
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.errors[0]?.message ?? 'Invalid input' })
  }

  const { recruiterId, vacancyId, email } = parsed.data
  const config = useRuntimeConfig(event)

  const imapConfig = {
    host: config.imapHost as string,
    port: Number(config.imapPort) || 993,
    user: config.imapUser as string,
    password: config.imapPassword as string
  }

  if (!imapConfig.host || !imapConfig.user || !imapConfig.password) {
    throw createError({ statusCode: 503, statusMessage: 'Email integration is not available' })
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

  // Fetch emails via IMAP
  let emails: Awaited<ReturnType<typeof fetchEmailsByAddress>>
  try {
    emails = await fetchEmailsByAddress(email, imapConfig)
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch emails' })
  }

  // Fetch existing email messages for this recruiter to dedup by sentAt::content
  const existing = db
    .select({ sentAt: messages.sentAt, content: messages.content })
    .from(messages)
    .where(and(eq(messages.recruiterId, recruiterId), eq(messages.source, 'email')))
    .all()

  const existingKeys = new Set(existing.map(m => `${m.sentAt}::${m.content}`))

  const toInsert: Array<typeof messages.$inferInsert> = []

  for (const msg of emails) {
    const content = msg.subject
      ? `[${msg.subject}]\n${msg.body}`.trim()
      : msg.body.trim()

    if (!content) continue

    const key = `${msg.date}::${content}`
    if (existingKeys.has(key)) continue

    toInsert.push({
      vacancyId,
      recruiterId,
      source: 'email',
      direction: msg.direction,
      content,
      sentAt: msg.date
    })
    existingKeys.add(key)
  }

  if (toInsert.length > 0) {
    db.transaction((tx) => {
      for (const row of toInsert) {
        tx.insert(messages).values(row).run()
      }
    })
  }

  return { imported: toInsert.length, total: emails.length }
})
