import { useDatabase } from '../../database/index'
import { recruiters } from '../../database/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const db = useDatabase()
  const [deleted] = db
    .delete(recruiters)
    .where(eq(recruiters.id, id))
    .returning({ id: recruiters.id })
    .all()

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Recruiter not found' })
  }

  setResponseStatus(event, 204)
  return null
})
