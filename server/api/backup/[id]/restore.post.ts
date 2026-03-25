import { gunzip } from 'node:zlib'
import { promisify } from 'node:util'
import { writeFile, copyFile, unlink } from 'node:fs/promises'
import { resolve } from 'node:path'
import { eq } from 'drizzle-orm'
import { useDatabase, closeDatabase } from '../../../database/index'
import { settings } from '../../../database/schema'
import { createDriveClientOAuth } from '../../../utils/gdrive-backup'

const gunzipAsync = promisify(gunzip)

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

  let compressed: Buffer
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (drive.files.get as any)(
      { fileId: id, alt: 'media' },
      { responseType: 'arraybuffer' }
    )
    compressed = Buffer.from(response.data as ArrayBuffer)
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Failed to download backup from Google Drive' })
  }

  let decompressed: Buffer
  try {
    decompressed = await gunzipAsync(compressed)
  } catch {
    throw createError({ statusCode: 422, statusMessage: 'Failed to decompress backup file' })
  }

  const config = useRuntimeConfig(event)
  const dbPath = resolve((config.databaseUrl as string) || './data/hire-me.db')
  const tmpPath = `${dbPath}.restore-tmp`

  try {
    await writeFile(tmpPath, decompressed)
    closeDatabase()
    await copyFile(tmpPath, dbPath)
  } catch {
    throw createError({ statusCode: 500, statusMessage: 'Failed to restore database' })
  } finally {
    await unlink(tmpPath).catch(() => {})
  }

  return { ok: true }
})
