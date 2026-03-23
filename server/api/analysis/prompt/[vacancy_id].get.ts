import { z } from 'zod'
import { useDatabase } from '../../../database/index'
import { vacancies, recruiters, messages } from '../../../database/schema'
import { eq } from 'drizzle-orm'
import { buildAnalysisPrompt, type PromptLang } from '../../../utils/analysis-prompt'

const querySchema = z.object({
  lang: z.enum(['uk', 'en']).optional().default('uk'),
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const vacancyId = Number(getRouterParam(event, 'vacancy_id'))
  if (!Number.isInteger(vacancyId) || vacancyId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid vacancy ID' })
  }

  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid query' })
  }
  const lang = parsed.data.lang as PromptLang

  const db = useDatabase()

  const [vacancy] = db
    .select({
      company: vacancies.company,
      position: vacancies.position,
      applyDate: vacancies.applyDate,
      urlDou: vacancies.urlDou,
      urlSite: vacancies.urlSite,
      description: vacancies.description,
      notes: vacancies.notes,
    })
    .from(vacancies)
    .where(eq(vacancies.id, vacancyId))
    .all()

  if (!vacancy) {
    throw createError({ statusCode: 404, statusMessage: 'Vacancy not found' })
  }

  const recruiterList = db
    .select({ name: recruiters.name, telegram: recruiters.telegram, email: recruiters.email, linkedin: recruiters.linkedin })
    .from(recruiters)
    .where(eq(recruiters.vacancyId, vacancyId))
    .all()

  const messageList = db
    .select({ direction: messages.direction, content: messages.content, sentAt: messages.sentAt, source: messages.source })
    .from(messages)
    .where(eq(messages.vacancyId, vacancyId))
    .all()

  const prompt = buildAnalysisPrompt({ vacancy, recruiters: recruiterList, messages: messageList }, lang)

  return { prompt }
})
