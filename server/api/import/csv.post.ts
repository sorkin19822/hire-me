import { parseVacanciesCSV } from '../../utils/csv-parser'
import { useDatabase } from '../../database/index'
import { pipelineStages, vacancies, recruiters } from '../../database/schema'

export default defineEventHandler(async (event) => {
  // Auth check
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const form = await readFormData(event)
  const file = form.get('file')

  if (!file || typeof file === 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Missing file field' })
  }

  const MAX_CSV_BYTES = 5 * 1024 * 1024 // 5 MB
  if (file.size > MAX_CSV_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'File too large (max 5 MB)' })
  }

  const content = await file.text()
  if (!content.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'File is empty' })
  }

  const db = useDatabase()

  // Load pipeline stages for name → id mapping
  const stages = db.select().from(pipelineStages).all()
  const stageMap = new Map(stages.map(s => [s.name, s.id]))

  const parsed = parseVacanciesCSV(content)

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  // Wrap all inserts in a single transaction
  const insertAll = db.transaction(() => {
    for (const v of parsed) {
      try {
        const stageId = stageMap.get(v.stageName) ?? stageMap.get('Відгук') ?? null

        const [inserted] = db.insert(vacancies).values({
          company: v.company,
          position: v.position,
          applyDate: v.applyDate ?? undefined,
          stageId,
          notes: v.notes ?? undefined,
        }).returning({ id: vacancies.id }).all()

        if (v.recruiterTelegram) {
          db.insert(recruiters).values({
            vacancyId: inserted.id,
            name: v.recruiterTelegram,
            telegram: v.recruiterTelegram,
          }).run()
        }

        imported++
      }
      catch (err) {
        skipped++
        console.error(`[csv-import] row error [${v.company}]:`, err)
        errors.push(`${v.company} — не вдалося імпортувати`)
      }
    }
  })

  try {
    insertAll()
  }
  catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Import transaction failed',
    })
  }

  return {
    success: true,
    total: parsed.length,
    imported,
    skipped,
    errors,
  }
})
