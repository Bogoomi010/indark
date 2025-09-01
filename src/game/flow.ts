import type { Dir, CurrentDoc } from './types'
import { moveCooldownMs, step } from './types'
import { useGameStore } from './state'
import { hasSTAForMove, hasTorch, isDoorLocked } from './guards'
import { LocalStoragePositionRepo, type PositionRepo } from '../services/positionRepo'

export async function tryMove(dir: Dir, opts?: { repo?: PositionRepo; now?: number; failSaveOnce?: boolean }) {
  const repo = opts?.repo ?? new LocalStoragePositionRepo()
  const now = opts?.now ?? Date.now()
  const {
    userId,
    playerState,
    pos,
    torch,
    sta,
    worldSeed,
    cooldownUntil,
    setState,
    refreshExits,
  } = useGameStore.getState()

  if (playerState !== 'Idle') return
  if (now < cooldownUntil) return
  if (!hasTorch(torch) || !hasSTAForMove(sta)) return
  if (isDoorLocked(dir)) return

  // 전이: Move.Select -> Move.Entering
  setState({ playerState: 'Move.Select' })
  setState({ playerState: 'Move.Entering' })

  const prev = { pos, torch, sta } as const
  const nextPos = step(pos, dir)

  // 낙관적 갱신
  const optimistic: CurrentDoc = {
    pos: nextPos,
    facing: dir,
    torch: torch - 1,
    sta: sta - 1,
    worldSeed,
    updatedAt: now,
    version: 1,
  }
  setState({ pos: nextPos, torch: optimistic.torch, sta: optimistic.sta, facing: dir })
  refreshExits()

  try {
    // 저장
    if (opts?.failSaveOnce) {
      // 테스트 목적으로 실패 유도
      throw new Error('mock save failure')
    }
    await repo.saveCurrent(userId, optimistic)
    // 성공 → Explore 전이, 쿨다운 설정
    setState({ playerState: 'Room.Explore', cooldownUntil: now + moveCooldownMs, lastError: undefined })
  } catch (err) {
    // 롤백
    setState({ pos: prev.pos, torch: prev.torch, sta: prev.sta, playerState: 'Idle', lastError: (err as Error).message })
    refreshExits()
  }
}


