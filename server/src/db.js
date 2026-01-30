import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

let db;

export function getDb() {
  if (db) return db;
  const dbPath = process.env.DB_PATH ?? '/data/indark.sqlite';
  const dir = path.dirname(dbPath);
  try { fs.mkdirSync(dir, { recursive: true }); } catch {}

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS player_state (
      user_id TEXT PRIMARY KEY,
      state_json TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS room_state (
      user_id TEXT NOT NULL,
      room_key TEXT NOT NULL,
      event_on INTEGER NOT NULL DEFAULT 1,
      rest_used INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, room_key)
    );
  `);

  // Lightweight migration: add rest_used if missing (older DBs)
  try {
    const cols = db.prepare(`PRAGMA table_info(room_state)`).all().map(r => r.name);
    if (!cols.includes('rest_used')) {
      db.exec('ALTER TABLE room_state ADD COLUMN rest_used INTEGER NOT NULL DEFAULT 0');
    }
  } catch {}

  return db;
}
