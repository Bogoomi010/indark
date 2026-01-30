import http from 'node:http';
import { getUserId, readJson, sendJson, sendText } from './http.js';
import { getOrCreatePlayer, resetPlayer, savePlayer, ensureRoom, setRoomEventOn, getRoomEventOn } from './storeSqlite.js';
import { snapshotRoom, validateMove, applyMove, roomTypeFor } from './game.js';

const port = process.env.PORT ? Number(process.env.PORT) : 8080;

const routes = {
  '/health': async (_req, res) => {
    sendJson(res, 200, { status: 'ok', time: new Date().toISOString() });
  },

  '/game/start': async (req, res) => {
    const userId = getUserId(req);
    const now = Date.now();
    const state = getOrCreatePlayer(userId);
    const roomKey = `${state.pos.x},${state.pos.y}`;
    const eventOn = ensureRoom(userId, roomKey, 0);
    const log = [{ ts: now, level: 'info', code: 'GAME_START', msg: 'game start', ctx: { userId } }];
    sendJson(res, 200, { state, room: snapshotRoom(state, { eventOn }), log });
  },

  '/game/state': async (req, res) => {
    const userId = getUserId(req);
    const now = Date.now();
    const state = getOrCreatePlayer(userId);
    const roomKey = `${state.pos.x},${state.pos.y}`;
    const eventOn = ensureRoom(userId, roomKey, 0);
    const log = [{ ts: now, level: 'debug', code: 'GAME_STATE', msg: 'game state', ctx: { userId } }];
    sendJson(res, 200, { state, room: snapshotRoom(state, { eventOn }), log });
  },

  '/game/reset': async (req, res) => {
    const userId = getUserId(req);
    const now = Date.now();
    const state = resetPlayer(userId);
    const roomKey = `${state.pos.x},${state.pos.y}`;
    const eventOn = ensureRoom(userId, roomKey, 0);
    const log = [{ ts: now, level: 'info', code: 'GAME_RESET', msg: 'game reset', ctx: { userId } }];
    sendJson(res, 200, { state, room: snapshotRoom(state, { eventOn }), log });
  },

  '/game/move': async (req, res) => {
    const userId = getUserId(req);
    const state = getOrCreatePlayer(userId);
    const body = await readJson(req);
    const dir = body?.dir;
    const now = Date.now();

    if (!['N', 'E', 'S', 'W'].includes(dir)) {
      sendJson(res, 400, {
        ok: false,
        code: 'BAD_REQUEST',
        message: 'dir must be one of N/E/S/W',
        log: [{ ts: now, level: 'warn', code: 'BAD_REQUEST', msg: 'invalid move dir', ctx: { dir } }],
      });
      return;
    }

    const valid = validateMove(state, dir, now);
    if (!valid.ok) {
      const roomKey = `${state.pos.x},${state.pos.y}`;
      const eventOn = ensureRoom(userId, roomKey, 0);
      sendJson(res, 200, {
        ok: false,
        ...valid,
        state,
        room: snapshotRoom(state, { eventOn }),
        log: [{ ts: now, level: 'info', code: valid.code ?? 'MOVE_BLOCKED', msg: valid.message ?? 'move blocked', ctx: { dir, roomKey } }],
      });
      return;
    }

    const { next, log, firstVisit, roomType } = applyMove(state, dir, now);

    // Ensure room state exists for the destination room.
    const destKey = `${next.pos.x},${next.pos.y}`;
    const defaultEventOn = (destKey === '0,0') ? 0 : 1;
    const eventOn = ensureRoom(userId, destKey, defaultEventOn);

    // Persist player
    next.version = (state.version ?? 1) + 1;
    savePlayer(next);

    sendJson(res, 200, { ok: true, state: next, room: snapshotRoom(next, { eventOn }), log, meta: { firstVisit, roomType } });
  },

  '/game/room/resolve': async (req, res) => {
    const userId = getUserId(req);
    const state = getOrCreatePlayer(userId);
    const body = await readJson(req);
    const action = body?.action;

    const roomKey = `${state.pos.x},${state.pos.y}`;
    const currentOn = ensureRoom(userId, roomKey, roomKey === '0,0' ? 0 : 1);
    const roomType = roomTypeFor(state.pos, state.worldSeed);

    const now = Date.now();

    // Empty room: allow REST even after LOOK cleared the room event.
    if (!currentOn && roomType === 'Empty' && action === 'REST') {
      const next = { ...state };
      next.hp = Math.min(next.hp + 10, 999);
      next.updatedAt = now;
      next.version = (state.version ?? 1) + 1;
      savePlayer(next);
      sendJson(res, 200, {
        ok: true,
        state: next,
        room: snapshotRoom(next, { eventOn: false }),
        log: [
          { ts: now, level: 'info', code: 'REST', msg: 'rested in empty room', ctx: { hpDelta: 10 } },
          { ts: now, level: 'info', code: 'STATE', msg: 'state after rest', ctx: { hp: next.hp } },
        ],
        meta: { roomType, action },
      });
      return;
    }

    if (!currentOn) {
      sendJson(res, 200, {
        ok: false,
        code: 'ALREADY_CLEARED',
        message: 'Room event already resolved',
        state,
        room: snapshotRoom(state, { eventOn: false }),
        log: [{ ts: now, level: 'info', code: 'ROOM_ALREADY_CLEARED', msg: 'room already cleared', ctx: { roomKey, roomType } }],
      });
      return;
    }

    // MVP resolve rules: one-tap clear + tiny rewards depending on room type.
    const next = { ...state };
    const log = [];

    if (roomType === 'Treasure') {
      next.torch = Math.min(next.torch + 10, 999);
      log.push({ ts: now, level: 'info', code: 'TREASURE', msg: 'found supplies', ctx: { torchDelta: 10 } });
    } else if (roomType === 'Trap') {
      // pay stamina to disarm; if not enough, just clear with no reward
      if (next.sta >= 2) {
        next.sta -= 2;
        log.push({ ts: now, level: 'info', code: 'TRAP', msg: 'disarmed trap', ctx: { staDelta: -2 } });
      } else {
        log.push({ ts: now, level: 'info', code: 'TRAP', msg: 'barely escaped', ctx: { sta: next.sta } });
      }
    } else if (roomType === 'Monster') {
      // simple fight
      next.hp = Math.max(next.hp - 5, 0);
      log.push({ ts: now, level: 'info', code: 'MONSTER', msg: 'fought monster', ctx: { hpDelta: -5 } });
    } else if (roomType === 'Empty') {
      if (action === 'LOOK') {
        // MVP: small random loot
        const roll = Math.floor(Math.random() * 100);
        if (roll < 40) {
          next.torch = Math.min(next.torch + 5, 999);
          log.push({ ts: now, level: 'info', code: 'LOOK', msg: 'found torch supplies', ctx: { torchDelta: 5 } });
        } else if (roll < 70) {
          next.sta = Math.min(next.sta + 3, 999);
          log.push({ ts: now, level: 'info', code: 'LOOK', msg: 'found food', ctx: { staDelta: 3 } });
        } else {
          log.push({ ts: now, level: 'info', code: 'LOOK', msg: 'found nothing', ctx: { roll } });
        }
      } else if (action === 'REST') {
        // REST when event is still on: allow it too.
        next.hp = Math.min(next.hp + 10, 999);
        log.push({ ts: now, level: 'info', code: 'REST', msg: 'rested', ctx: { hpDelta: 10 } });
      } else {
        log.push({ ts: now, level: 'debug', code: 'ROOM', msg: 'unknown empty action', ctx: { action } });
      }
    } else {
      log.push({ ts: now, level: 'debug', code: 'ROOM', msg: 'nothing to resolve', ctx: { roomType } });
    }

    // mark cleared
    setRoomEventOn(userId, roomKey, false);

    next.updatedAt = now;
    next.version = (state.version ?? 1) + 1;
    savePlayer(next);

    sendJson(res, 200, {
      ok: true,
      state: next,
      room: snapshotRoom(next, { eventOn: false }),
      log: [
        { ts: now, level: 'info', code: 'ROOM_RESOLVE', msg: 'resolved room event', ctx: { roomKey, roomType, action: action ?? null } },
        ...log,
        { ts: now, level: 'info', code: 'STATE', msg: 'state after resolve', ctx: { torch: next.torch, sta: next.sta, hp: next.hp, mp: next.mp } },
      ],
      meta: { roomType, action: action ?? null },
    });
  },
};

const server = http.createServer(async (req, res) => {
  // Basic CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const path = url.pathname;

  // Only allow GET/POST for MVP endpoints
  const handler = routes[path];
  if (handler && (req.method === 'GET' || req.method === 'POST')) {
    try {
      await handler(req, res);
    } catch (e) {
      sendJson(res, 500, { ok: false, code: 'SERVER_ERROR', message: (e instanceof Error ? e.message : String(e)) });
    }
    return;
  }

  if (path === '/') {
    sendText(res, 200, 'InDark server is running. Try GET /health or POST /game/start\n');
    return;
  }

  sendJson(res, 404, { ok: false, code: 'NOT_FOUND', message: `No route for ${path}` });
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[indark-server] listening on http://localhost:${port}`);
});
