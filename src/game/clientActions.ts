import { useGameStore } from './state'
import type { InventorySlot } from './types'
import { getItemDef } from './items'
import { FirestorePositionRepo } from '../services/positionRepo.firestore'
import { backendMode } from '../config/runtime'

type LogEntry = { ts: number; level: 'info'|'warn'|'error'; code: string; msg: string; ctx?: any }

function emptyInv(): InventorySlot[] {
  return Array.from({ length: 20 }).map((_, slot) => ({ slot, itemId: null, qty: 0 }))
}

function now() { return Date.now() }

function roomKey() {
  const p = useGameStore.getState().pos
  return `${p.x},${p.y}`
}

function ensureMaps() {
  const s = useGameStore.getState()
  if (!s.roomEventOn) useGameStore.getState().setState({ roomEventOn: {} as any })
  if (!s.roomRestUsed) useGameStore.getState().setState({ roomRestUsed: {} as any })
}

function addItem(inv: InventorySlot[], itemId: string, qty=1): { ok: boolean; inv: InventorySlot[] } {
  const def = getItemDef(itemId)
  const next = inv.map(x => ({ ...x }))
  if (def.stackable) {
    const existing = next.find(s => s.itemId === itemId)
    if (existing) {
      existing.qty += qty
      return { ok: true, inv: next }
    }
  }
  const empty = next.find(s => !s.itemId)
  if (!empty) return { ok: false, inv: next }
  empty.itemId = itemId
  empty.qty = qty
  return { ok: true, inv: next }
}

async function persistFirebase(): Promise<void> {
  const s = useGameStore.getState()
  const repo = new FirestorePositionRepo()
  await repo.saveCurrent(s.userId, {
    pos: s.pos,
    facing: s.facing,
    torch: s.torch,
    sta: s.sta,
    hp: s.hp,
    mp: s.mp,
    gold: s.gold,
    inventory: s.inventory,
    equipment: s.equipment,
    worldSeed: s.worldSeed,
    cooldownUntil: s.cooldownUntil,
    updatedAt: Date.now(),
    version: (s as any).version ?? 1,
    roomEventOn: s.roomEventOn as any,
    roomRestUsed: (s as any).roomRestUsed ?? {},
  } as any)
}

export async function resolveAction(action: string): Promise<{ ok: boolean; log: LogEntry[] }> {
  const mode = backendMode()
  if (mode === 'server') {
    const m = await import('./serverActions')
    const r = await m.serverResolve(action)
    return { ok: Boolean(r.ok), log: (r.log ?? []) as any }
  }

  // firebase/local mode
  ensureMaps()
  const key = roomKey()
  const s = useGameStore.getState()
  const ts = now()

  const roomType = (await import('./room')).roomTypeFor(s.pos.x, s.pos.y, s.worldSeed)
  const eventOn = (s.roomEventOn as any)?.[key]
  const restUsed = (s as any).roomRestUsed?.[key] === true

  // 안전모드: 이벤트 상태가 없으면 아무것도 안함
  if (eventOn === undefined) {
    return { ok: false, log: [{ ts, level: 'warn', code: 'NO_ROOM_STATE', msg: 'room state not ready', ctx: { key } }] }
  }

  // REST: Empty/Treasure 이벤트 종료 후 + 방당 1회
  if (action === 'REST') {
    if (!(roomType === 'Empty' || roomType === 'Treasure')) {
      return { ok: false, log: [{ ts, level: 'info', code: 'REST_NOT_ALLOWED', msg: 'rest not allowed here', ctx: { roomType } }] }
    }
    if (eventOn !== false) {
      return { ok: false, log: [{ ts, level: 'info', code: 'REST_LOCKED', msg: 'rest requires cleared event', ctx: { key } }] }
    }
    if (restUsed) {
      return { ok: false, log: [{ ts, level: 'info', code: 'REST_USED', msg: 'already rested in this room', ctx: { key } }] }
    }

    useGameStore.getState().setState({ hp: Math.min(s.hp + 10, 999), roomRestUsed: { ...(s as any).roomRestUsed, [key]: true } })
    await persistFirebase()
    return { ok: true, log: [{ ts, level: 'info', code: 'REST', msg: 'rested (+10hp)', ctx: { key } }] }
  }

  // LOOK/SEARCH: Empty/Treasure에서 보상 1개 후 이벤트 종료
  if (action === 'LOOK' || action === 'SEARCH') {
    if (!(roomType === 'Empty' || roomType === 'Treasure')) {
      return { ok: false, log: [{ ts, level: 'info', code: 'LOOK_NOT_ALLOWED', msg: 'look not allowed here', ctx: { roomType } }] }
    }
    if (eventOn !== true) {
      return { ok: false, log: [{ ts, level: 'info', code: 'ALREADY_CLEARED', msg: 'event already cleared', ctx: { key } }] }
    }

    // reward: one roll
    const roll = Math.floor(Math.random() * 100)
    let log: LogEntry[] = []

    if (roll < 45) {
      const gain = 5 + Math.floor(Math.random() * 11)
      useGameStore.getState().setState({ gold: s.gold + gain })
      log.push({ ts, level: 'info', code: 'LOOK_GOLD', msg: `found gold (+${gain})`, ctx: { gain, roll } })
    } else {
      const foods = ['food_apple', 'food_bread', 'food_meat']
      const picked = foods[Math.floor(Math.random() * foods.length)]
      const added = addItem(s.inventory ?? emptyInv(), picked, 1)
      useGameStore.getState().setState({ inventory: added.inv })
      log.push({ ts, level: added.ok ? 'info' : 'warn', code: added.ok ? 'LOOK_ITEM' : 'INV_FULL', msg: added.ok ? `found ${picked}` : 'inventory full', ctx: { itemId: picked, roll } })
    }

    // clear event
    useGameStore.getState().setState({ roomEventOn: { ...(s.roomEventOn as any), [key]: false } })
    await persistFirebase()
    return { ok: true, log }
  }

  // Fallback
  return { ok: false, log: [{ ts, level: 'info', code: 'UNSUPPORTED', msg: 'action not supported in firebase mode', ctx: { action } }] }
}

export async function useItem(slot: number): Promise<{ ok: boolean; log: LogEntry[] }> {
  const mode = backendMode()
  if (mode === 'server') {
    const m = await import('./serverActions')
    const r = await m.serverUseItem(slot)
    return { ok: Boolean(r.ok), log: (r.log ?? []) as any }
  }

  const s = useGameStore.getState()
  const ts = now()
  const inv = (s.inventory ?? emptyInv()).map(x => ({ ...x }))
  const it = inv[slot]
  if (!it || !it.itemId || it.qty <= 0) return { ok: false, log: [{ ts, level: 'info', code: 'EMPTY_SLOT', msg: 'empty slot', ctx: { slot } }] }

  const def = getItemDef(it.itemId)
  if (def.kind !== 'consumable') return { ok: false, log: [{ ts, level: 'info', code: 'NOT_USABLE', msg: 'not usable', ctx: { itemId: it.itemId } }] }

  // consume 1
  it.qty -= 1
  if (it.qty <= 0) { it.qty = 0; it.itemId = null }

  // effect: simple mapping
  let hpDelta = 0
  if (def.itemId === 'food_apple') hpDelta = 10
  if (def.itemId === 'food_bread') hpDelta = 20
  if (def.itemId === 'food_meat') hpDelta = 30

  useGameStore.getState().setState({ inventory: inv, hp: Math.min(s.hp + hpDelta, 999) })
  await persistFirebase()
  return { ok: true, log: [{ ts, level: 'info', code: 'ITEM_USE', msg: 'used item', ctx: { slot, hpDelta } }] }
}
