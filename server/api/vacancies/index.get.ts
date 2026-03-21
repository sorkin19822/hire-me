import { z } from 'zod'
import { useDatabase } from '../../database/index'
import { vacancies, pipelineStages, messages } from '../../database/schema'
import { eq, like, or, and, sql, desc } from 'drizzle-orm'

const querySchema = z.object({
  stage_id: z.coerce.number().int().positive().optional(),
  search: z.string().max(200).optional(),
  order: z.enum(['apply_date', 'created_at']).optional(),
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.errors[0]?.message ?? 'Invalid query' })
  }

  const { stage_id: stageId, search, order = 'created_at' } = parsed.data

  const db = useDatabase()

  const messagesCount = db
    .select({ vacancyId: messages.vacancyId, count: sql<number>`count(*)`.as('count') })
    .from(messages)
    .groupBy(messages.vacancyId)
    .as('msg_counts')

  const conditions = []
  if (stageId !== undefined) conditions.push(eq(vacancies.stageId, stageId))
  if (search) {
    const pattern = `%${search}%`
    conditions.push(or(like(vacancies.company, pattern), like(vacancies.position, pattern))!)
  }

  const q = db
    .select({
      id: vacancies.id,
      company: vacancies.company,
      position: vacancies.position,
      applyDate: vacancies.applyDate,
      stageId: vacancies.stageId,
      stageName: pipelineStages.name,
      stageColor: pipelineStages.color,
      notes: vacancies.notes,
      urlDou: vacancies.urlDou,
      urlLinkedin: vacancies.urlLinkedin,
      urlSite: vacancies.urlSite,
      createdAt: vacancies.createdAt,
      updatedAt: vacancies.updatedAt,
      messagesCount: sql<number>`coalesce(${messagesCount.count}, 0)`,
    })
    .from(vacancies)
    .leftJoin(pipelineStages, eq(vacancies.stageId, pipelineStages.id))
    .leftJoin(messagesCount, eq(vacancies.id, messagesCount.vacancyId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(order === 'apply_date' ? desc(vacancies.applyDate) : desc(vacancies.createdAt))

  return q.all()
})
