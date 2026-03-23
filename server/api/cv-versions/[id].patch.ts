import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDatabase } from '../../database/index'
import { cvVersions } from '../../database/schema'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive()
})

const bodySchema = z
  .object({
    comment: z.string().max(500).nullable().optional()
  })
  .strict()

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const { id } = paramsSchema.parse(getRouterParams(event))
  const body = await readBody(event)
  const data = bodySchema.parse(body)

  const db = useDatabase()

  const existing = db
    .select({ id: cvVersions.id })
    .from(cvVersions)
    .where(eq(cvVersions.id, id))
    .get()

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'CV version not found' })
  }

  const [updated] = db
    .update(cvVersions)
    .set(data)
    .where(eq(cvVersions.id, id))
    .returning()
    .all()

  return updated
})
