import type { CurrentDoc } from '../game/types'
import type { PositionRepo } from './positionRepo'

async function postJson<T>(path: string, userId: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId,
    },
    body: JSON.stringify(body ?? {}),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as T
}

export class ServerPositionRepo implements PositionRepo {
  async loadCurrent(userId: string): Promise<CurrentDoc | null> {
    // Server creates state if missing
    const data = await postJson<{ state: CurrentDoc }>('/game/start', userId, {})
    return data.state
  }

  async saveCurrent(_userId: string, _doc: CurrentDoc): Promise<void> {
    // Client should not overwrite authoritative state.
    // Movement + interactions go through /game/move and /game/room/resolve.
    throw new Error('ServerPositionRepo.saveCurrent is not supported; use server actions')
  }
}
