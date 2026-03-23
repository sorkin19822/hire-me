import { z } from 'zod'
import { useDatabase } from '../../database/index'
import { recruiters } from '../../database/schema'
import { requireAuth } from '../../utils/auth'

const schema = z.object({
  vacancyId: z.number().int().positive().optional(),
  name: z.string().min(1).max(255),
  telegram: z.string().regex(/^@?[A-Za-z0-9_]{5,32}$/, 'Invalid Telegram username').optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  linkedin: z.string().url().refine(v => /^https?:\/\//i.test(v), 'URL must use http(s)').optional().or(z.literal(''))
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
    .insert(recruiters)
    .values({
      vacancyId: parsed.data.vacancyId,
      name: parsed.data.name,
      telegram: parsed.data.telegram || null,
      email: parsed.data.email || null,
      linkedin: parsed.data.linkedin || null
    })
    .returning()
    .all()

  setResponseStatus(event, 201)
  return created
})
