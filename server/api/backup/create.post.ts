import { gzip } from 'node:zlib'
import { promisify } from 'node:util'
import { readFile, unlink } from 'node:fs/promises'
import { Readable } from 'node:stream'
import Database from 'better-sqlite3'
import { eq } from 'drizzle-orm'
import { useDatabase } from '../../database/index'
import { settings } from '../../database/schema'
import { createDriveClientOAuth } from '../../utils/gdrive-backup'

const gzipAsync = promisify(gzip)

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const config = useRuntimeConfig(event)
  const folderId = config.googleBackupFolderId as string
  const clientId = process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID ?? ''
  const clientSecret = process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET ?? ''

  if (!folderId || !clientId || !clientSecret) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Backup not configured. Set NUXT_GOOGLE_BACKUP_FOLDER_ID in .env'
    })
  }

  const db = useDatabase()
  const [tokenRow] = db.select().from(settings).where(eq(settings.key, 'google_drive_refresh_token')).all()

  if (!tokenRow) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Google Drive not authorized. Log out and log in again to grant Drive access.'
    })
  }

  const dbPath = (config.databaseUrl as string) || './data/hire-me.db'
  const tmpPath = `${dbPath}.backup-tmp`

  const srcDb = new Database(dbPath, { readonly: true })
  try {
    await srcDb.backup(tmpPath)
  } finally {
    srcDb.close()
  }

  const raw = await readFile(tmpPath)
  const compressed = await gzipAsync(raw)
  await unlink(tmpPath).catch(() => {})

  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const filename = `hire-me-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.db.gz`

  const drive = createDriveClientOAuth(clientId, clientSecret, tokenRow.value)

  const uploaded = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId]
    },
    media: {
      mimeType: 'application/gzip',
      body: Readable.from(compressed)
    },
    fields: 'id,name,size,createdTime'
  })

  return {
    id: uploaded.data.id,
    name: uploaded.data.name,
    size: uploaded.data.size,
    createdAt: uploaded.data.createdTime
  }
})
