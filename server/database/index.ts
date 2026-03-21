import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function useDatabase() {
  if (_db) return _db

  const url = resolve(process.env.DATABASE_URL || './data/hire-me.db')

  // Auto-create the data/ directory if it does not exist
  mkdirSync(dirname(url), { recursive: true })

  const sqlite = new Database(url)

  // Performance & integrity pragmas
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  _db = drizzle(sqlite, { schema })
  return _db
}
