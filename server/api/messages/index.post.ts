import { z } from 'zod'
import { useDatabase } from '../../database/index'
import { messages, recruiters } from '../../database/schema'
import { eq, and } from 'drizzle-orm'

const MIN_DATE = '2000-01-01T00:00:00.000Z'
const MAX_DATE = '2100-01-01T00:00:00.000Z'

const schema = z.object({
  vacancyId: z.number().int().positive(),
  recruiterId: z.number().int().positive().optional(),
  source: z.enum(['telegram', 'email', 'manual']),
  direction: z.enum(['in', 'out']),
  content: z.string().min(1).max(10000),
  sentAt: z.string().datetime({ offset: true })
    .refine(v => v >= MIN_DATE && v <= MAX_DATE, 'sentAt out of valid range')
    .optional()
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.errors[0]?.message ?? 'Invalid input' })
  }

  const db = useDatabase()

  // Validate recruiterId belongs to the same vacancy
  if (parsed.data.recruiterId !== undefined) {
    const [rec] = db
      .select({ id: recruiters.id })
      .from(recruiters)
      .where(and(eq(recruiters.id, parsed.data.recruiterId), eq(recruiters.vacancyId, parsed.data.vacancyId)))
      .all()
    if (!rec) {
      throw createError({ statusCode: 400, statusMessage: 'Recruiter does not belong to this vacancy' })
    }
  }

  const [created] = db
    .insert(messages)
    .values({
      vacancyId: parsed.data.vacancyId,
      recruiterId: parsed.data.recruiterId,
      source: parsed.data.source,
      direction: parsed.data.direction,
      content: parsed.data.content,
      sentAt: parsed.data.sentAt ?? new Date().toISOString()
    })
    .returning()
    .all()

  setResponseStatus(event, 201)
  return created
})
