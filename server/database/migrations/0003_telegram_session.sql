CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

ALTER TABLE recruiters ADD COLUMN tg_synced_at TEXT;
