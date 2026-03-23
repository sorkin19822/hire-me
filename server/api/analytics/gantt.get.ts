import { useDatabase } from '../../database/index'
import { vacancies, pipelineStages } from '../../database/schema'
import { eq, isNotNull, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const db = useDatabase()

  return db
    .select({
      id: vacancies.id,
      company: vacancies.company,
      position: vacancies.position,
      applyDate: vacancies.applyDate,
      updatedAt: vacancies.updatedAt,
      stageColor: pipelineStages.color,
      stageName: pipelineStages.name
    })
    .from(vacancies)
    .leftJoin(pipelineStages, eq(vacancies.stageId, pipelineStages.id))
    .where(isNotNull(vacancies.applyDate))
    .orderBy(desc(vacancies.applyDate))
    .limit(30)
    .all()
})
