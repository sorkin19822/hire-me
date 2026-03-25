import { eq } from 'drizzle-orm'
import { useDatabase } from '../../database/index'
import { settings } from '../../database/schema'
import { createDriveClientOAuth } from '../../utils/gdrive-backup'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing backup id' })
  }

  const clientId = process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID ?? ''
  const clientSecret = process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET ?? ''

  const db = useDatabase()
  const [tokenRow] = db.select().from(settings).where(eq(settings.key, 'google_drive_refresh_token')).all()

  if (!tokenRow) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Google Drive not authorized.'
    })
  }

  const drive = createDriveClientOAuth(clientId, clientSecret, tokenRow.value)

  try {
    await drive.files.delete({ fileId: id })
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Failed to delete file from Google Drive' })
  }

  return { ok: true }
})
