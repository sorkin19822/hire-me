import { useDatabase } from '../../database/index'
import { vacancies } from '../../database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const db = useDatabase()

  const [deleted] = db
    .delete(vacancies)
    .where(eq(vacancies.id, id))
    .returning({ id: vacancies.id })
    .all()

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Vacancy not found' })
  }

  setResponseStatus(event, 204)
  return null
})
