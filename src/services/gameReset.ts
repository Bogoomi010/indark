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
}


