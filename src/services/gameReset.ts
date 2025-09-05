import type { CurrentDoc } from '../game/types'
import { defaultWorldSeed, initialHp, initialMp, initialSta, initialTorch } from '../game/types'
import { FirestorePositionRepo } from './positionRepo.firestore'

export async function resetCharacter(userId: string): Promise<void> {
  const repo = new FirestorePositionRepo()
  const doc: CurrentDoc = {
    pos: { x: 0, y: 0 },
    torch: initialTorch,
    sta: initialSta,
    hp: initialHp,
    mp: initialMp,
    worldSeed: defaultWorldSeed,
    cooldownUntil: 0,
    updatedAt: Date.now(),
    version: 1,
  }
  await repo.saveCurrent(userId, doc)
  // 다음 앱 로드에서 "처음 시작" 이미지가 1회 노출되도록 플래그 저장
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem('indark_just_reset', '1') } catch {}
  }
}


