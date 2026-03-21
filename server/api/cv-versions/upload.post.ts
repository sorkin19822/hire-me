import { desc } from 'drizzle-orm'
import { useDatabase } from '../../database/index'
import { cvVersions } from '../../database/schema'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const parts = await readMultipartFormData(event)
  if (!parts?.length) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
  }

  const filePart = parts.find(p => p.name === 'file')
  if (!filePart?.data) {
    throw createError({ statusCode: 400, statusMessage: 'Field "file" is required' })
  }

  const rawFilename = (filePart.filename ?? 'cv.docx')
    .replace(/[/\\?%*:|"<>\x00-\x1f]/g, '_')
    .slice(0, 255)

  if (!rawFilename.toLowerCase().endsWith('.docx')) {
    throw createError({ statusCode: 400, statusMessage: 'Only .docx files are accepted' })
  }
  const filename = rawFilename

  if (filePart.data.length > MAX_SIZE) {
    throw createError({ statusCode: 413, statusMessage: 'File too large (max 5 MB)' })
  }

  // Store file content as base64 for optional later extraction
  const content = filePart.data.toString('base64')

  const db = useDatabase()

  db.transaction((tx) => {
    // Deactivate all existing versions
    tx.update(cvVersions)
      .set({ isActive: false })
      .run()

    // Insert new active version
    tx.insert(cvVersions).values({
      filename,
      content,
      isActive: true,
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
