import { z } from 'zod'
import { useDatabase } from '../../database/index'
import { vacancies } from '../../database/schema'
import { eq, sql } from 'drizzle-orm'

const schema = z.object({
  company: z.string().min(1).max(255).optional(),
  position: z.string().min(1).max(255).optional(),
  stageId: z.number().int().positive().nullable().optional(),
  applyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  description: z.string().max(50000).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  urlDou: z.string().url().nullable().optional().or(z.literal('')),
  urlLinkedin: z.string().url().nullable().optional().or(z.literal('')),
  urlSite: z.string().url().nullable().optional().or(z.literal('')),
  cvVersionId: z.number().int().positive().nullable().optional()
}).strict()

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Invalid input' })
  }

  if (Object.keys(parsed.data).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No fields to update' })
  }

  const db = useDatabase()

  const [updated] = db
    .update(vacancies)
    .set({ ...parsed.data, updatedAt: sql`(datetime('now'))` })
    .where(eq(vacancies.id, id))
    .returning()
    .all()

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Vacancy not found' })
  }

  return updated
})
