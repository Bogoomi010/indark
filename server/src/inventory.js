import { getItem } from './items.js';

export const MAX_SLOTS = 20;

export function emptyInventory() {
  return Array.from({ length: MAX_SLOTS }).map((_, slot) => ({ slot, itemId: null, qty: 0 }));
}

/**
 * Add item to inventory. Returns { ok, inventory, log }.
 */
export function addItem(inv, itemId, qty = 1) {
  const def = getItem(itemId);
  if (!def) {
    return { ok: false, inventory: inv, log: [{ level: 'warn', code: 'UNKNOWN_ITEM', msg: 'unknown item', ctx: { itemId } }] };
  }

  const next = inv.map(s => ({ ...s }));

  if (def.stackable) {
    const existing = next.find(s => s.itemId === itemId);
    if (existing) {
      existing.qty += qty;
      return { ok: true, inventory: next, log: [{ level: 'info', code: 'ITEM_STACK', msg: 'stacked item', ctx: { itemId, qty } }] };
    }
  }

  const empty = next.find(s => !s.itemId);
  if (!empty) {
    return { ok: false, inventory: next, log: [{ level: 'info', code: 'INV_FULL', msg: 'inventory full', ctx: { itemId, qty } }] };
  }

  empty.itemId = itemId;
  empty.qty = qty;
  return { ok: true, inventory: next, log: [{ level: 'info', code: 'ITEM_ADD', msg: 'added item', ctx: { itemId, qty, slot: empty.slot } }] };
}

export function consumeFromSlot(inv, slot, qty = 1) {
  const next = inv.map(s => ({ ...s }));
  const s = next[slot];
  if (!s || !s.itemId || s.qty <= 0) return { ok: false, inventory: inv, reason: 'EMPTY' };
  if (s.qty < qty) return { ok: false, inventory: inv, reason: 'NOT_ENOUGH' };
  s.qty -= qty;
  if (s.qty === 0) s.itemId = null;
  return { ok: true, inventory: next, itemId: s.itemId, slot };
}
