import { z } from 'zod'
import { useDatabase } from '../../database/index'
import { pipelineStages } from '../../database/schema'
import { eq } from 'drizzle-orm'

const schema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  order: z.number().int().min(0).optional(),
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
    .update(pipelineStages)
    .set(parsed.data)
    .where(eq(pipelineStages.id, id))
    .returning()
    .all()

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Stage not found' })
  }

  return updated
})
