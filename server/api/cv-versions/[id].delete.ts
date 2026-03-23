import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDatabase } from '../../database/index'
import { cvVersions } from '../../database/schema'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const { id } = paramsSchema.parse(getRouterParams(event))

  const db = useDatabase()

  const existing = db
    .select({ id: cvVersions.id })
    .from(cvVersions)
    .where(eq(cvVersions.id, id))
    .get()

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'CV version not found' })
  }

  db.delete(cvVersions).where(eq(cvVersions.id, id)).run()

  setResponseStatus(event, 204)
  return null
})
