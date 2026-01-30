// Minimal server-authoritative game logic for InDark (MVP)
// NOTE: This is intentionally simple and deterministic.

export const DEFAULTS = {
  worldSeed: 'indark-default-seed',
  startPos: { x: 0, y: 0 },
  torch: 100,
  sta: 100,
  hp: 100,
  mp: 30,
  moveCooldownMs: 800,
};

/** @param {number} x @param {number} y */
function keyOf(x, y) {
  return `${x},${y}`;
}

/** Simple deterministic hash (FNV-1a-ish) */
export function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * Determine exits for a room.
 * For MVP: always allow all directions.
 */
export function openExits(_pos, _worldSeed) {
  return { N: true, E: true, S: true, W: true };
}

export function step(pos, dir) {
  switch (dir) {
    case 'N': return { x: pos.x, y: pos.y - 1 };
    case 'S': return { x: pos.x, y: pos.y + 1 };
    case 'W': return { x: pos.x - 1, y: pos.y };
    case 'E': return { x: pos.x + 1, y: pos.y };
    default: return pos;
  }
}

export function roomTypeFor(pos, worldSeed) {
  const h = hash32(`${worldSeed}:${pos.x},${pos.y}`) % 100;
  // Keep probabilities simple and readable.
  // 0-44 Empty (45%)
  // 45-59 Monster (15%)
  // 60-72 Trap (13%)
  // 73-85 Treasure (13%)
  // 86-99 Shop (14%)
  if (h < 45) return 'Empty';
  if (h < 60) return 'Monster';
  if (h < 73) return 'Trap';
  if (h < 86) return 'Treasure';
  return 'Shop';
}

export function initialState(userId, now = Date.now()) {
  return {
    userId,
    playerState: 'Idle',
    pos: { ...DEFAULTS.startPos },
    facing: undefined,
    torch: DEFAULTS.torch,
    sta: DEFAULTS.sta,
    hp: DEFAULTS.hp,
    mp: DEFAULTS.mp,
    worldSeed: DEFAULTS.worldSeed,
    cooldownUntil: 0,
    updatedAt: now,
    version: 1,
    // UI helpers
    exits: openExits(DEFAULTS.startPos, DEFAULTS.worldSeed),
    visitedRooms: { [keyOf(DEFAULTS.startPos.x, DEFAULTS.startPos.y)]: true },
    roomEventOn: { [keyOf(DEFAULTS.startPos.x, DEFAULTS.startPos.y)]: false },
  };
}

export function snapshotRoom(state, opts = {}) {
  const k = keyOf(state.pos.x, state.pos.y);
  const eventOn = (typeof opts.eventOn === 'boolean') ? opts.eventOn : (state.roomEventOn?.[k] ?? true);
  // For now: roomType + eventOn. (Client can derive variants.)
  return {
    key: k,
    roomType: roomTypeFor(state.pos, state.worldSeed),
    eventState: { active: Boolean(eventOn), cleared: !Boolean(eventOn) },
    exits: state.exits,
  };
}

export function validateMove(state, dir, now) {
  if (state.playerState !== 'Idle') return { ok: false, code: 'BUSY', message: 'Player is busy' };
  if (now < (state.cooldownUntil ?? 0)) return { ok: false, code: 'COOLDOWN', message: 'Move is on cooldown' };
  if (state.torch <= 0) return { ok: false, code: 'NO_TORCH', message: 'No torch left' };
  if (state.sta <= 0) return { ok: false, code: 'NO_STA', message: 'No stamina left' };
  const exits = state.exits ?? openExits(state.pos, state.worldSeed);
  if (!exits[dir]) return { ok: false, code: 'NO_EXIT', message: 'No exit in that direction' };
  return { ok: true };
}

export function applyMove(state, dir, now) {
  const nextPos = step(state.pos, dir);
  const next = {
    ...state,
    pos: nextPos,
    facing: dir,
    torch: state.torch - 1,
    sta: state.sta - 1,
    cooldownUntil: now + DEFAULTS.moveCooldownMs,
    updatedAt: now,
    playerState: 'Room.Explore',
  };

  // Mark visited
  const k = keyOf(nextPos.x, nextPos.y);
  const visitedRooms = { ...(next.visitedRooms ?? {}) };
  const firstVisit = !visitedRooms[k];
  if (firstVisit) visitedRooms[k] = true;

  // Event defaults: first visit => event active, except start room.
  const roomEventOn = { ...(next.roomEventOn ?? {}) };
  if (roomEventOn[k] === undefined) roomEventOn[k] = true;

  next.visitedRooms = visitedRooms;
  next.roomEventOn = roomEventOn;
  next.exits = openExits(nextPos, next.worldSeed);

  const roomType = roomTypeFor(nextPos, next.worldSeed);

  const log = [];
  log.push({ ts: now, level: 'info', code: 'MOVE', msg: `move ${dir}`, ctx: { dir, to: nextPos } });
  log.push({ ts: now, level: 'info', code: 'STATE', msg: 'resources after move', ctx: { torch: next.torch, sta: next.sta, hp: next.hp, mp: next.mp } });
  log.push({ ts: now, level: 'info', code: 'ROOM', msg: firstVisit ? 'entered new room' : 'revisited room', ctx: { roomKey: k, roomType, firstVisit } });

  // After exploring, go back to Idle (client can still render explore).
  // This keeps movement available for the next input.
  next.playerState = 'Idle';

  return { next, roomType, firstVisit, log };
}
