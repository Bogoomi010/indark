export async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf-8');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function sendJson(res, status, obj) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(obj));
}

export function sendText(res, status, text) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
}

export function getUserId(req) {
  // MVP: allow explicit header for local dev.
  // Later: replace with Firebase token verification.
  const h = req.headers;
  return (
    h['x-user-id'] ||
    // if someone passes Authorization: Bearer <uid> for quick tests
    (typeof h.authorization === 'string' && h.authorization.startsWith('Bearer ') ? h.authorization.slice('Bearer '.length) : null) ||
    'anon'
  );
}
