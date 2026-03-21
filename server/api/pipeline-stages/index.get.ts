import { useDatabase } from '../../database/index'
import { pipelineStages } from '../../database/schema'
import { asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const db = useDatabase()
  return db.select().from(pipelineStages).orderBy(asc(pipelineStages.order)).all()
})
