import { useDatabase } from '../../database/index'
import { vacancies, pipelineStages, recruiters, analysis } from '../../database/schema'
import { eq, sql, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const db = useDatabase()

  const [vacancy] = db
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
      cvVersionId: vacancies.cvVersionId,
      description: vacancies.description,
      createdAt: vacancies.createdAt,
      updatedAt: vacancies.updatedAt,
      messagesCount: sql<number>`(select count(*) from messages where messages.vacancy_id = ${vacancies.id})`
    })
    .from(vacancies)
    .leftJoin(pipelineStages, eq(vacancies.stageId, pipelineStages.id))
    .where(eq(vacancies.id, id))
    .all()

  if (!vacancy) {
    throw createError({ statusCode: 404, statusMessage: 'Vacancy not found' })
  }

  const vacancyRecruiters = db
    .select()
    .from(recruiters)
    .where(eq(recruiters.vacancyId, id))
    .all()

  const rawAnalysis = db
    .select()
    .from(analysis)
    .where(eq(analysis.vacancyId, id))
    .orderBy(desc(analysis.createdAt))
    .limit(1)
    .all()[0] ?? null

  const lastAnalysis = rawAnalysis
    ? {
        companyScore: rawAnalysis.companyScore,
        recruiterScore: rawAnalysis.recruiterScore,
        redFlags: rawAnalysis.redFlags ? JSON.parse(rawAnalysis.redFlags) as string[] : [],
        greenFlags: rawAnalysis.greenFlags ? JSON.parse(rawAnalysis.greenFlags) as string[] : [],
        summary: rawAnalysis.summary,
        createdAt: rawAnalysis.createdAt
      }
    : null

  return { ...vacancy, recruiters: vacancyRecruiters, lastAnalysis }
})
