import { initialState } from './game.js';

/** In-memory store: userId -> state */
const store = new Map();

export function getOrCreate(userId) {
  if (!store.has(userId)) store.set(userId, initialState(userId));
  return store.get(userId);
}

export function setState(userId, state) {
  store.set(userId, state);
}

export function reset(userId) {
  const s = initialState(userId);
  store.set(userId, s);
  return s;
}
