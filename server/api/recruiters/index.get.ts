import { z } from 'zod'
import { useDatabase } from '../../database/index'
import { recruiters, vacancies } from '../../database/schema'
import { eq, like, and } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'

const querySchema = z.object({
  vacancy_id: z.coerce.number().int().positive().optional(),
  search: z.string().max(200).optional()
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Invalid query' })
  }

  const { vacancy_id: vacancyId, search } = parsed.data
  const db = useDatabase()

  const conditions = []
  if (vacancyId !== undefined) conditions.push(eq(recruiters.vacancyId, vacancyId))
  if (search) conditions.push(like(recruiters.name, `%${search}%`))

  return db
    .select({
      id: recruiters.id,
      vacancyId: recruiters.vacancyId,
      name: recruiters.name,
      telegram: recruiters.telegram,
      email: recruiters.email,
      linkedin: recruiters.linkedin,
      createdAt: recruiters.createdAt,
      vacancyCompany: vacancies.company,
      vacancyPosition: vacancies.position
    })
    .from(recruiters)
    .leftJoin(vacancies, eq(recruiters.vacancyId, vacancies.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .all()
})
