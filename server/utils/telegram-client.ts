import { createRequire } from 'node:module'
import { useDatabase } from '../database/index'
import { settings } from '../database/schema'
import { eq } from 'drizzle-orm'

// GramJS is a CJS package. Use createRequire so it loads correctly inside
// Nitro's ESM bundle, the same approach used for better-sqlite3.
const _require = createRequire(import.meta.url)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { TelegramClient } = _require('telegram') as { TelegramClient: any }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { StringSession } = _require('telegram/sessions') as { StringSession: any }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: any | null = null

export async function getTelegramClient(): Promise<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any
  Api: { auth: { SignIn: new (args: { phoneNumber: string, phoneCodeHash: string, phoneCode: string }) => unknown } }
}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { Api } = _require('telegram') as { Api: any }

  if (_client?.connected) return { client: _client, Api }

  const config = useRuntimeConfig()
  const apiId = Number(config.telegramApiId)
  const apiHash = config.telegramApiHash as string

  if (!apiId || !apiHash) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Telegram API credentials are not configured (TELEGRAM_API_ID / TELEGRAM_API_HASH)'
    })
  }

  const db = useDatabase()
  const row = db.select().from(settings).where(eq(settings.key, 'telegram_session')).get()
  const sessionStr = row?.value ?? ''

  const session = new StringSession(sessionStr)
  _client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 3
  })

  await _client.connect()
  return { client: _client, Api }
}

export async function saveTelegramSession(sessionStr: string) {
  const db = useDatabase()
  db.insert(settings)
    .values({ key: 'telegram_session', value: sessionStr })
    .onConflictDoUpdate({ target: settings.key, set: { value: sessionStr } })
    .run()
}

export async function saveSetting(key: string, value: string) {
  const db = useDatabase()
  db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
    .run()
}

export function loadSetting(key: string): string | null {
  const db = useDatabase()
  const row = db.select().from(settings).where(eq(settings.key, key)).get()
  return row?.value ?? null
}
