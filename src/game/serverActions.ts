import type { Dir } from './types'
import { useGameStore } from './state'

type MoveResponse = {
  ok: boolean
  code?: string
  message?: string
  state: any
  room: { key: string; roomType: string; eventState: { active: boolean; cleared: boolean } }
  log?: string[]
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const userId = useGameStore.getState().userId
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as T
}

function syncFromServer(payload: { state: any; room: any }) {
  const { state, room } = payload
  const setState = useGameStore.getState().setState
  // Keep client store in sync with authoritative server state
  setState({
    pos: state.pos,
    facing: state.facing,
    torch: state.torch,
    sta: state.sta,
    hp: state.hp,
    mp: state.mp,
    worldSeed: state.worldSeed,
    cooldownUntil: state.cooldownUntil ?? 0,
    lastError: undefined,
    playerState: 'Idle',
  })

  if (room?.key) {
    const key = room.key
    const on = Boolean(room.eventState?.active)
    const current = useGameStore.getState().roomEventOn
    setState({ roomEventOn: { ...current, [key]: on } })
  }

  useGameStore.getState().refreshExits()
}

export async function serverMove(dir: Dir) {
  const data = await post<MoveResponse>('/game/move', { dir })
  if (data.ok) syncFromServer({ state: data.state, room: data.room })
  else {
    useGameStore.getState().setState({ lastError: data.message ?? data.code ?? 'move failed', playerState: 'Idle' })
  }
  return data
}

export async function serverResolve(action: string) {
  const data = await post<MoveResponse>('/game/room/resolve', { action })
  if (data.ok) syncFromServer({ state: data.state, room: data.room })
  return data
}
