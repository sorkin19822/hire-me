import { useDatabase } from '../../database/index'
import { pipelineStages } from '../../database/schema'
import { asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const db = useDatabase()
  return db.select().from(pipelineStages).orderBy(asc(pipelineStages.order)).all()
})
