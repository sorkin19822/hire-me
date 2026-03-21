import { drizzle } from 'drizzle-orm/better-sqlite3'
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import * as schema from './schema'

// Use createRequire so better-sqlite3 (CJS native addon) loads correctly
// in both ESM dev mode and Nitro production bundles
const _require = createRequire(import.meta.url)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Database: any = _require('better-sqlite3')

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function useDatabase() {
  if (_db) return _db

  const url = resolve(process.env.DATABASE_URL || process.env.NUXT_DATABASE_URL || './data/hire-me.db')

  mkdirSync(dirname(url), { recursive: true })

  const sqlite = new Database(url)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  _db = drizzle(sqlite, { schema })
  return _db
}
