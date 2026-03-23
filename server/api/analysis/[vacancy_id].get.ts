import { useDatabase } from '../../database/index'
import { analysis } from '../../database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const vacancyId = Number(getRouterParam(event, 'vacancy_id'))
  if (!Number.isInteger(vacancyId) || vacancyId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid vacancy ID' })
  }

  const db = useDatabase()
  const [row] = db
    .select()
    .from(analysis)
    .where(eq(analysis.vacancyId, vacancyId))
    .all()

  if (!row) return null

  return {
    companyScore: row.companyScore,
    recruiterScore: row.recruiterScore,
    redFlags: row.redFlags ? JSON.parse(row.redFlags) as string[] : [],
    greenFlags: row.greenFlags ? JSON.parse(row.greenFlags) as string[] : [],
    summary: row.summary,
    createdAt: row.createdAt
  }
})
