import { useDatabase } from '../../database/index'
import { recruiters, vacancies } from '../../database/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const db = useDatabase()
  const [recruiter] = db
    .select({
      id: recruiters.id,
      vacancyId: recruiters.vacancyId,
      name: recruiters.name,
      telegram: recruiters.telegram,
      email: recruiters.email,
      linkedin: recruiters.linkedin,
      createdAt: recruiters.createdAt,
      vacancyCompany: vacancies.company,
      vacancyPosition: vacancies.position,
    })
    .from(recruiters)
    .leftJoin(vacancies, eq(recruiters.vacancyId, vacancies.id))
    .where(eq(recruiters.id, id))
    .all()

  if (!recruiter) {
    throw createError({ statusCode: 404, statusMessage: 'Recruiter not found' })
  }

  return recruiter
})
