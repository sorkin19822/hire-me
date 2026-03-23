import { useDatabase } from '../../../database/index'
import { cvVersions } from '../../../database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const db = useDatabase()
  const [cv] = db
    .select({ filename: cvVersions.filename, content: cvVersions.content })
    .from(cvVersions)
    .where(eq(cvVersions.id, id))
    .all()

  if (!cv) {
    throw createError({ statusCode: 404, statusMessage: 'CV not found' })
  }

  if (!cv.content) {
    throw createError({ statusCode: 404, statusMessage: 'File content not available' })
  }

  const isPdf = cv.filename.toLowerCase().endsWith('.pdf')
  const contentType = isPdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

  setHeader(event, 'Content-Type', contentType)
  setHeader(event, 'Content-Disposition', `inline; filename="${cv.filename}"`)

  return Buffer.from(cv.content, 'base64')
})
