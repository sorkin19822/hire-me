import { desc } from 'drizzle-orm'
import { useDatabase } from '../../database/index'
import { cvVersions } from '../../database/schema'

/**
 * Expected Google Drive MCP HTTP wrapper response.
 * GET /latest-cv → { id, name, content }
 * where content is the extracted text from the .docx file.
 */
interface GDriveCV {
  id: string
  name: string
  content: string
}

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const config = useRuntimeConfig(event)
  const mcpUrl = config.googleDriveMcpUrl as string | undefined

  if (!mcpUrl) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Google Drive integration is not available. Upload your CV manually instead.'
    })
  }

  let cv: GDriveCV
  try {
    cv = await $fetch<GDriveCV>(`${mcpUrl}/latest-cv`, { timeout: 30000 })
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch CV from Google Drive' })
  }

  if (!cv.name || !cv.id) {
    throw createError({ statusCode: 502, statusMessage: 'Google Drive returned an invalid response' })
  }

  const db = useDatabase()

  db.transaction((tx) => {
    tx.update(cvVersions).set({ isActive: false }).run()
    tx.insert(cvVersions).values({
      filename: cv.name,
      gdriveId: cv.id,
      content: cv.content ?? null,
      isActive: true
    }).run()
  })

  const [inserted] = db
    .select({ id: cvVersions.id, filename: cvVersions.filename, importedAt: cvVersions.importedAt })
    .from(cvVersions)
    .orderBy(desc(cvVersions.id))
    .limit(1)
    .all()

  return inserted
})
