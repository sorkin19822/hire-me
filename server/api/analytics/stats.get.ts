import { useDatabase } from '../../database/index'
import { vacancies, pipelineStages } from '../../database/schema'
import { isNull, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const db = useDatabase()

  const stages = db
    .select()
    .from(pipelineStages)
    .orderBy(pipelineStages.order)
    .all()

  // Count vacancies per stage
  const counts = db
    .select({
      stageId: vacancies.stageId,
      count: sql<number>`count(*)`,
    })
    .from(vacancies)
    .groupBy(vacancies.stageId)
    .all()

  const countMap = new Map(counts.map(c => [c.stageId, c.count]))

  const byStage = stages.map(s => ({
    id: s.id,
    name: s.name,
    color: s.color,
    order: s.order,
    isTerminal: s.isTerminal,
    count: countMap.get(s.id) ?? 0,
  }))

  const total = byStage.reduce((sum, s) => sum + s.count, 0)

  // Interviews = HR + Тех.інтерв'ю + CTO + Тест (non-terminal, non-first)
  const interviewNames = ['HR скринінг', 'Технічне інтерв\'ю', 'CTO інтерв\'ю', 'Тестове завдання']
  const interviews = byStage
    .filter(s => interviewNames.some(n => s.name.toLowerCase().includes(n.toLowerCase().split(' ')[0]!)))
    .reduce((sum, s) => sum + s.count, 0)

  const rejections = byStage
    .filter(s => s.isTerminal && s.name.toLowerCase().includes('відмов'))
    .reduce((sum, s) => sum + s.count, 0)

  const offers = byStage
    .filter(s => s.name.toLowerCase().includes('оффер') || s.name.toLowerCase().includes('offer'))
    .reduce((sum, s) => sum + s.count, 0)

  const conversionRate = total > 0 ? Math.round((offers / total) * 100) : 0

  // Vacancies with no stage
  const unstaged = db
    .select({ count: sql<number>`count(*)` })
    .from(vacancies)
    .where(isNull(vacancies.stageId))
    .get()

  if ((unstaged?.count ?? 0) > 0) {
    byStage.unshift({
      id: 0,
      name: 'Без стадії',
      color: '#9ca3af',
      order: -1,
      isTerminal: false,
      count: unstaged!.count,
    })
  }

  return {
    total,
    interviews,
    rejections,
    offers,
    conversionRate,
    byStage,
  }
})
