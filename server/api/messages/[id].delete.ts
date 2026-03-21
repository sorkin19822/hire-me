import { useDatabase } from '../../database/index'
import { messages } from '../../database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const db = useDatabase()
  const [deleted] = db
    .delete(messages)
    .where(eq(messages.id, id))
    .returning({ id: messages.id })
    .all()

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Message not found' })
  }

  setResponseStatus(event, 204)
  return null
})
