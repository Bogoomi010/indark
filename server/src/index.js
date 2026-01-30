import http from 'node:http';
import { getUserId, readJson, sendJson, sendText } from './http.js';
import { getOrCreatePlayer, resetPlayer, savePlayer, ensureRoom, setRoomEventOn, getRoomEventOn } from './storeSqlite.js';
import { snapshotRoom, validateMove, applyMove, roomTypeFor } from './game.js';
import { addItem, MAX_SLOTS, emptyInventory } from './inventory.js';
import { getItem } from './items.js';

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

    // Backward-compat if older saves exist
    if (!Array.isArray(state.inventory)) state.inventory = emptyInventory();
    if (typeof state.gold !== 'number') state.gold = 0;

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

    // Resolve rules: one-tap clear + rewards depending on room type.
    const next = { ...state };
    next.inventory = Array.isArray(next.inventory) ? next.inventory : emptyInventory();
    next.gold = typeof next.gold === 'number' ? next.gold : 0;

    const log = [];

    if (roomType === 'Treasure') {
      // Treasure becomes a gold-like payout.
      const gain = 15;
      next.gold += gain;
      log.push({ ts: now, level: 'info', code: 'TREASURE', msg: 'found gold', ctx: { goldDelta: gain } });
    } else if (roomType === 'Trap') {
      if (next.sta >= 2) {
        next.sta -= 2;
        log.push({ ts: now, level: 'info', code: 'TRAP', msg: 'disarmed trap', ctx: { staDelta: -2 } });
      } else {
        log.push({ ts: now, level: 'info', code: 'TRAP', msg: 'barely escaped', ctx: { sta: next.sta } });
      }
    } else if (roomType === 'Monster') {
      next.hp = Math.max(next.hp - 5, 0);
      log.push({ ts: now, level: 'info', code: 'MONSTER', msg: 'fought monster', ctx: { hpDelta: -5 } });
    } else if (roomType === 'Empty') {
      if (action === 'LOOK') {
        // Loot table: pick exactly ONE reward.
        // 0-44: gold, 45-74: bread, 75-87: weapon, 88-99: armor
        const roll = Math.floor(Math.random() * 100);
        if (roll < 45) {
          const gain = 5 + Math.floor(Math.random() * 11); // 5-15
          next.gold += gain;
          log.push({ ts: now, level: 'info', code: 'LOOK', msg: 'found gold', ctx: { goldDelta: gain, roll } });
        } else if (roll < 75) {
          const added = addItem(next.inventory, 'food_bread', 1);
          next.inventory = added.inventory;
          log.push({ ts: now, level: 'info', code: 'LOOK', msg: 'found item', ctx: { itemId: 'food_bread', roll } });
          for (const l of added.log) log.push({ ts: now, level: l.level, code: l.code, msg: l.msg, ctx: l.ctx });
        } else if (roll < 88) {
          const added = addItem(next.inventory, 'weapon_rusty_sword', 1);
          next.inventory = added.inventory;
          log.push({ ts: now, level: 'info', code: 'LOOK', msg: 'found item', ctx: { itemId: 'weapon_rusty_sword', roll } });
          for (const l of added.log) log.push({ ts: now, level: l.level, code: l.code, msg: l.msg, ctx: l.ctx });
        } else {
          const added = addItem(next.inventory, 'armor_leather_vest', 1);
          next.inventory = added.inventory;
          log.push({ ts: now, level: 'info', code: 'LOOK', msg: 'found item', ctx: { itemId: 'armor_leather_vest', roll } });
          for (const l of added.log) log.push({ ts: now, level: l.level, code: l.code, msg: l.msg, ctx: l.ctx });
        }
      } else if (action === 'REST') {
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
        { ts: now, level: 'info', code: 'STATE', msg: 'state after resolve', ctx: { torch: next.torch, sta: next.sta, hp: next.hp, mp: next.mp, gold: next.gold } },
      ],
      meta: { roomType, action: action ?? null },
    });
  },

  '/game/item/use': async (req, res) => {
    const userId = getUserId(req);
    const state = getOrCreatePlayer(userId);
    const now = Date.now();
    const body = await readJson(req);
    const slot = Number(body?.slot);

    if (!Array.isArray(state.inventory)) state.inventory = emptyInventory();
    if (typeof state.gold !== 'number') state.gold = 0;

    if (!Number.isInteger(slot) || slot < 0 || slot >= MAX_SLOTS) {
      sendJson(res, 400, { ok: false, code: 'BAD_REQUEST', message: 'slot out of range', log: [{ ts: now, level: 'warn', code: 'BAD_REQUEST', msg: 'invalid slot', ctx: { slot } }] });
      return;
    }

    const s = state.inventory[slot];
    if (!s || !s.itemId || s.qty <= 0) {
      sendJson(res, 200, { ok: false, code: 'EMPTY_SLOT', message: 'empty slot', state, log: [{ ts: now, level: 'info', code: 'EMPTY_SLOT', msg: 'empty slot', ctx: { slot } }] });
      return;
    }

    const def = getItem(s.itemId);
    if (!def) {
      sendJson(res, 200, { ok: false, code: 'UNKNOWN_ITEM', message: 'unknown item', state, log: [{ ts: now, level: 'warn', code: 'UNKNOWN_ITEM', msg: 'unknown item', ctx: { itemId: s.itemId } }] });
      return;
    }

    if (def.kind !== 'consumable' || !def.useEffect) {
      sendJson(res, 200, { ok: false, code: 'NOT_USABLE', message: 'item is not usable', state, log: [{ ts: now, level: 'info', code: 'NOT_USABLE', msg: 'item not usable', ctx: { itemId: def.itemId } }] });
      return;
    }

    const next = { ...state, inventory: state.inventory.map(x => ({ ...x })) };

    // consume 1
    next.inventory[slot].qty -= 1;
    if (next.inventory[slot].qty <= 0) {
      next.inventory[slot].qty = 0;
      next.inventory[slot].itemId = null;
    }

    const logs = [{ ts: now, level: 'info', code: 'ITEM_USE', msg: 'used item', ctx: { slot, itemId: def.itemId } }];

    if (def.useEffect.type === 'healHp') {
      const before = next.hp;
      next.hp = Math.min(next.hp + def.useEffect.amount, 999);
      logs.push({ ts: now, level: 'info', code: 'EFFECT_HEAL', msg: 'healed hp', ctx: { hpDelta: next.hp - before } });
    }

    next.updatedAt = now;
    next.version = (state.version ?? 1) + 1;
    savePlayer(next);

    sendJson(res, 200, { ok: true, state: next, log: [...logs, { ts: now, level: 'info', code: 'STATE', msg: 'state after item use', ctx: { hp: next.hp, gold: next.gold } }] });
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
