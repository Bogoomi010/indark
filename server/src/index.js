import http from 'node:http';
import { getUserId, readJson, sendJson, sendText } from './http.js';
import { getOrCreate, reset as resetUser, setState } from './store.js';
import { snapshotRoom, validateMove, applyMove } from './game.js';

const port = process.env.PORT ? Number(process.env.PORT) : 8080;

const routes = {
  '/health': async (_req, res) => {
    sendJson(res, 200, { status: 'ok', time: new Date().toISOString() });
  },

  '/game/start': async (req, res) => {
    const userId = getUserId(req);
    const state = getOrCreate(userId);
    sendJson(res, 200, { state, room: snapshotRoom(state) });
  },

  '/game/state': async (req, res) => {
    const userId = getUserId(req);
    const state = getOrCreate(userId);
    sendJson(res, 200, { state, room: snapshotRoom(state) });
  },

  '/game/reset': async (req, res) => {
    const userId = getUserId(req);
    const state = resetUser(userId);
    // Mimic client behavior: set a reset flag hint
    sendJson(res, 200, { state, room: snapshotRoom(state) });
  },

  '/game/move': async (req, res) => {
    const userId = getUserId(req);
    const state = getOrCreate(userId);
    const body = await readJson(req);
    const dir = body?.dir;
    const now = Date.now();

    if (!['N', 'E', 'S', 'W'].includes(dir)) {
      sendJson(res, 400, { ok: false, code: 'BAD_REQUEST', message: 'dir must be one of N/E/S/W' });
      return;
    }

    const valid = validateMove(state, dir, now);
    if (!valid.ok) {
      sendJson(res, 200, { ok: false, ...valid, state, room: snapshotRoom(state) });
      return;
    }

    const { next, log } = applyMove(state, dir, now);
    setState(userId, next);
    sendJson(res, 200, { ok: true, state: next, room: snapshotRoom(next), log });
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
