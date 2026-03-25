import { eq } from 'drizzle-orm'
import { useDatabase } from '../../database/index'
import { settings } from '../../database/schema'
import { createDriveClientOAuth } from '../../utils/gdrive-backup'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const config = useRuntimeConfig(event)
  const folderId = config.googleBackupFolderId as string
  const clientId = process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID ?? ''
  const clientSecret = process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET ?? ''

  if (!folderId || !clientId || !clientSecret) {
    return { files: [], configured: false }
  }

  const db = useDatabase()
  const [tokenRow] = db.select().from(settings).where(eq(settings.key, 'google_drive_refresh_token')).all()

  if (!tokenRow) {
    return { files: [], configured: false }
  }

  const drive = createDriveClientOAuth(clientId, clientSecret, tokenRow.value)

  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    orderBy: 'createdTime desc',
    pageSize: 20,
    fields: 'files(id,name,size,createdTime)'
  })

  return { files: res.data.files ?? [], configured: true }
})
