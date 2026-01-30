import { getDb } from './db.js';
import { initialState } from './game.js';

function nowMs() {
  return Date.now();
}

export function loadPlayer(userId) {
  const db = getDb();
  const row = db.prepare('SELECT state_json FROM player_state WHERE user_id = ?').get(userId);
  if (!row) return null;
  const state = JSON.parse(row.state_json);
  // Backward-compat: ensure inventory/gold exist
  if (typeof state.gold !== 'number') state.gold = 0;
  if (!Array.isArray(state.inventory)) {
    state.inventory = Array.from({ length: 20 }).map((_, slot) => ({ slot, itemId: null, qty: 0 }));
  }
  return state;
}

export function savePlayer(state) {
  const db = getDb();
  const updatedAt = state.updatedAt ?? nowMs();
  const version = state.version ?? 1;
  db.prepare(
    `INSERT INTO player_state (user_id, state_json, version, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       state_json=excluded.state_json,
       version=excluded.version,
       updated_at=excluded.updated_at`
  ).run(state.userId, JSON.stringify(state), version, updatedAt);
}

export function getOrCreatePlayer(userId) {
  const existing = loadPlayer(userId);
  if (existing) return existing;
  const s = initialState(userId);
  savePlayer(s);
  // start room event defaults to off
  ensureRoom(userId, `${s.pos.x},${s.pos.y}`, 0);
  return s;
}

export function resetPlayer(userId) {
  const db = getDb();
  const s = initialState(userId);
  const tx = db.transaction(() => {
    savePlayer(s);
    db.prepare('DELETE FROM room_state WHERE user_id = ?').run(userId);
    ensureRoom(userId, `${s.pos.x},${s.pos.y}`, 0);
  });
  tx();
  return s;
}

export function ensureRoom(userId, roomKey, defaultEventOn = 1) {
  const db = getDb();
  const row = db.prepare('SELECT event_on FROM room_state WHERE user_id = ? AND room_key = ?').get(userId, roomKey);
  if (row) return Boolean(row.event_on);
  db.prepare(
    'INSERT INTO room_state (user_id, room_key, event_on, updated_at) VALUES (?, ?, ?, ?)'
  ).run(userId, roomKey, defaultEventOn ? 1 : 0, nowMs());
  return Boolean(defaultEventOn);
}

export function getRoomEventOn(userId, roomKey) {
  const db = getDb();
  const row = db.prepare('SELECT event_on FROM room_state WHERE user_id = ? AND room_key = ?').get(userId, roomKey);
  return row ? Boolean(row.event_on) : null;
}

export function setRoomEventOn(userId, roomKey, eventOn) {
  const db = getDb();
  db.prepare(
    `INSERT INTO room_state (user_id, room_key, event_on, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, room_key) DO UPDATE SET
       event_on=excluded.event_on,
       updated_at=excluded.updated_at`
  ).run(userId, roomKey, eventOn ? 1 : 0, nowMs());
}
