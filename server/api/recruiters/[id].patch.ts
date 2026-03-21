import { z } from 'zod'
import { useDatabase } from '../../database/index'
import { recruiters } from '../../database/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'

const schema = z.object({
  name: z.string().min(1).max(255).optional(),
  telegram: z.string().regex(/^@?[A-Za-z0-9_]{5,32}$/, 'Invalid Telegram username').nullable().optional().or(z.literal('')),
  email: z.string().email().nullable().optional().or(z.literal('')),
  linkedin: z.string().url().refine(v => /^https?:\/\//i.test(v), 'URL must use http(s)').nullable().optional().or(z.literal('')),
  vacancyId: z.number().int().positive().nullable().optional(),
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
    throw createError({ statusCode: 400, statusMessage: parsed.error.errors[0]?.message ?? 'Invalid input' })
  }

  if (Object.keys(parsed.data).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No fields to update' })
  }

  const db = useDatabase()
  const [updated] = db
    .update(recruiters)
    .set(parsed.data)
    .where(eq(recruiters.id, id))
    .returning()
    .all()

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Recruiter not found' })
  }

  return updated
})
