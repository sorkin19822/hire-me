import { z } from 'zod'
import { useDatabase } from '../../database/index'
import { vacancies } from '../../database/schema'

const schema = z.object({
  company: z.string().min(1).max(255),
  position: z.string().min(1).max(255),
  stageId: z.number().int().positive().optional(),
  applyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(5000).optional(),
  urlDou: z.string().url().optional().or(z.literal('')),
  urlLinkedin: z.string().url().optional().or(z.literal('')),
  urlSite: z.string().url().optional().or(z.literal(''))
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Invalid input' })
  }

  const db = useDatabase()
  const [created] = db
    .insert(vacancies)
    .values({
      company: parsed.data.company,
      position: parsed.data.position,
      stageId: parsed.data.stageId,
      applyDate: parsed.data.applyDate,
      notes: parsed.data.notes,
      urlDou: parsed.data.urlDou || null,
      urlLinkedin: parsed.data.urlLinkedin || null,
      urlSite: parsed.data.urlSite || null
    })
    .returning()
    .all()

  setResponseStatus(event, 201)
  return created
})
