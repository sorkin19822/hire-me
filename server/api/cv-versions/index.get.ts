import { desc } from 'drizzle-orm'
import { useDatabase } from '../../database/index'
import { cvVersions } from '../../database/schema'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const db = useDatabase()
  return db
    .select({
      id: cvVersions.id,
      filename: cvVersions.filename,
      gdriveId: cvVersions.gdriveId,
      isActive: cvVersions.isActive,
      importedAt: cvVersions.importedAt,
    })
    .from(cvVersions)
    .orderBy(desc(cvVersions.importedAt))
    .all()
})
