import { z } from 'zod'
import { useDatabase } from '../../database/index'
import { vacancies, analysis } from '../../database/schema'
import { eq } from 'drizzle-orm'

const bodySchema = z.object({
  result: z.string().min(1).max(10000)
})

const responseSchema = z.object({
  company_score: z.number().min(0).max(10),
  recruiter_score: z.number().min(0).max(10),
  red_flags: z.array(z.string()),
  green_flags: z.array(z.string()),
  summary: z.string()
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const vacancyId = Number(getRouterParam(event, 'vacancy_id'))
  if (!Number.isInteger(vacancyId) || vacancyId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid vacancy ID' })
  }

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.errors[0]?.message ?? 'Invalid input' })
  }

  const db = useDatabase()

  const [vacancy] = db
    .select({ id: vacancies.id })
    .from(vacancies)
    .where(eq(vacancies.id, vacancyId))
    .all()

  if (!vacancy) {
    throw createError({ statusCode: 404, statusMessage: 'Vacancy not found' })
  }

  // Extract JSON from the pasted text (Claude may add extra text around the JSON)
  let jsonText = parsed.data.result.trim()
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
  if (jsonMatch) jsonText = jsonMatch[0]

  let claudeResult: z.infer<typeof responseSchema>
  try {
    claudeResult = responseSchema.parse(JSON.parse(jsonText))
  } catch {
    throw createError({ statusCode: 422, statusMessage: 'Could not parse JSON — check the pasted text' })
  }

  const [existing] = db
    .select({ id: analysis.id })
    .from(analysis)
    .where(eq(analysis.vacancyId, vacancyId))
    .all()

  if (existing) {
    db.update(analysis)
      .set({
        companyScore: claudeResult.company_score,
        recruiterScore: claudeResult.recruiter_score,
        redFlags: JSON.stringify(claudeResult.red_flags),
        greenFlags: JSON.stringify(claudeResult.green_flags),
        summary: claudeResult.summary,
        createdAt: new Date().toISOString()
      })
      .where(eq(analysis.id, existing.id))
      .run()
  } else {
    db.insert(analysis).values({
      vacancyId,
      companyScore: claudeResult.company_score,
      recruiterScore: claudeResult.recruiter_score,
      redFlags: JSON.stringify(claudeResult.red_flags),
      greenFlags: JSON.stringify(claudeResult.green_flags),
      summary: claudeResult.summary
    }).run()
  }

  return {
    companyScore: claudeResult.company_score,
    recruiterScore: claudeResult.recruiter_score,
    redFlags: claudeResult.red_flags,
    greenFlags: claudeResult.green_flags,
    summary: claudeResult.summary
  }
})
