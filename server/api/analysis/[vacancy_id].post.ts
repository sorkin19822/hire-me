import { z } from 'zod'
import { useDatabase } from '../../database/index'
import { vacancies, recruiters, messages, analysis } from '../../database/schema'
import { eq, and } from 'drizzle-orm'
import { useClaudeClient } from '../../utils/claude-client'
import { buildAnalysisPrompt, ANALYSIS_SYSTEM_PROMPT } from '../../utils/analysis-prompt'

const responseSchema = z.object({
  company_score: z.number().min(0).max(10),
  recruiter_score: z.number().min(0).max(10),
  red_flags: z.array(z.string()),
  green_flags: z.array(z.string()),
  summary: z.string(),
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const vacancyId = Number(getRouterParam(event, 'vacancy_id'))
  if (!Number.isInteger(vacancyId) || vacancyId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid vacancy ID' })
  }

  const config = useRuntimeConfig(event)
  const apiKey = config.anthropicApiKey as string

  if (!apiKey) {
    throw createError({ statusCode: 503, statusMessage: 'AI analysis is not available' })
  }

  const db = useDatabase()

  // Fetch vacancy
  const [vacancy] = db
    .select({ company: vacancies.company, position: vacancies.position, notes: vacancies.notes })
    .from(vacancies)
    .where(eq(vacancies.id, vacancyId))
    .all()

  if (!vacancy) {
    throw createError({ statusCode: 404, statusMessage: 'Vacancy not found' })
  }

  // Fetch recruiters for this vacancy
  const recruiterList = db
    .select({ name: recruiters.name, telegram: recruiters.telegram, email: recruiters.email })
    .from(recruiters)
    .where(eq(recruiters.vacancyId, vacancyId))
    .all()

  // Fetch messages for this vacancy
  const messageList = db
    .select({ direction: messages.direction, content: messages.content, sentAt: messages.sentAt, source: messages.source })
    .from(messages)
    .where(eq(messages.vacancyId, vacancyId))
    .all()

  const prompt = buildAnalysisPrompt({ vacancy, recruiters: recruiterList, messages: messageList })

  const claude = useClaudeClient(apiKey)

  let responseText: string
  try {
    const response = await claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = response.content[0]
    responseText = block.type === 'text' ? block.text : ''
  }
  catch {
    throw createError({ statusCode: 503, statusMessage: 'AI analysis request failed' })
  }

  let parsed: z.infer<typeof responseSchema>
  try {
    const json = JSON.parse(responseText)
    const result = responseSchema.parse(json)
    parsed = result
  }
  catch {
    console.error('[analysis] Failed to parse Claude response:', responseText)
    throw createError({ statusCode: 502, statusMessage: 'AI returned an unexpected response' })
  }

  // Upsert — one analysis record per vacancy
  const [existing] = db
    .select({ id: analysis.id })
    .from(analysis)
    .where(eq(analysis.vacancyId, vacancyId))
    .all()

  if (existing) {
    db.update(analysis)
      .set({
        companyScore: parsed.company_score,
        recruiterScore: parsed.recruiter_score,
        redFlags: JSON.stringify(parsed.red_flags),
        greenFlags: JSON.stringify(parsed.green_flags),
        summary: parsed.summary,
        createdAt: new Date().toISOString(),
      })
      .where(eq(analysis.id, existing.id))
      .run()
  }
  else {
    db.insert(analysis).values({
      vacancyId,
      companyScore: parsed.company_score,
      recruiterScore: parsed.recruiter_score,
      redFlags: JSON.stringify(parsed.red_flags),
      greenFlags: JSON.stringify(parsed.green_flags),
      summary: parsed.summary,
    }).run()
  }

  return {
    companyScore: parsed.company_score,
    recruiterScore: parsed.recruiter_score,
    redFlags: parsed.red_flags,
    greenFlags: parsed.green_flags,
    summary: parsed.summary,
  }
})
