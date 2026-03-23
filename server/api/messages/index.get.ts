import { z } from 'zod'
import { useDatabase } from '../../database/index'
import { messages, recruiters } from '../../database/schema'
import { eq, asc } from 'drizzle-orm'

const querySchema = z.object({
  vacancy_id: z.coerce.number().int().positive()
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'vacancy_id is required' })
  }

  const db = useDatabase()

  return db
    .select({
      id: messages.id,
      vacancyId: messages.vacancyId,
      recruiterId: messages.recruiterId,
      recruiterName: recruiters.name,
      source: messages.source,
      direction: messages.direction,
      content: messages.content,
      sentAt: messages.sentAt,
      importedAt: messages.importedAt
    })
    .from(messages)
    .leftJoin(recruiters, eq(messages.recruiterId, recruiters.id))
    .where(eq(messages.vacancyId, parsed.data.vacancy_id))
    .orderBy(asc(messages.sentAt))
    .all()
})
