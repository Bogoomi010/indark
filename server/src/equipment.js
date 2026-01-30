import { getItem } from './items.js';

export function equipmentSlotForItem(itemId) {
  const def = getItem(itemId);
  if (!def) return null;
  if (def.kind === 'weapon') return 'weapon';
  if (def.kind === 'armor') return 'armor';
  return null;
}

/**
 * Equip item without moving it out of inventory.
 * Returns { ok, equipment, log }.
 */
export function equipFromSlot(state, slot) {
  const s = state.inventory?.[slot];
  if (!s || !s.itemId || s.qty <= 0) return { ok: false, code: 'EMPTY_SLOT', message: 'empty slot' };
  const equipSlot = equipmentSlotForItem(s.itemId);
  if (!equipSlot) return { ok: false, code: 'NOT_EQUIPPABLE', message: 'item is not equippable' };

  const equipment = { ...(state.equipment ?? { weapon: null, armor: null }) };
  equipment[equipSlot] = s.itemId;
  return { ok: true, equipment, equipSlot, itemId: s.itemId };
}
