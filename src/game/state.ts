import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { CurrentDoc, Dir, PlayerState, Vec2 } from './types'
import { defaultWorldSeed, initialSta, initialTorch } from './types'
import { LocalStoragePositionRepo, type PositionRepo } from '../services/positionRepo'
import { openExits } from './exits'

export interface GameSlice {
  userId: string
  playerState: PlayerState
  pos: Vec2
  facing?: Dir
  torch: number
  sta: number
  worldSeed: string
  lastError?: string
  cooldownUntil: number

  exits: { N: boolean; E: boolean; S: boolean; W: boolean }

  // actions
  init(userId: string, repo?: PositionRepo): Promise<void>
  setState(s: Partial<GameSlice>): void
  refreshExits(): void
}

const defaultPos: Vec2 = { x: 0, y: 0 }

export const useGameStore = create<GameSlice>()(
  devtools((set: (partial: Partial<GameSlice> | ((state: GameSlice) => Partial<GameSlice>)) => void, get: () => GameSlice) => ({
    userId: 'mock-user',
    playerState: 'Idle',
    pos: defaultPos,
    torch: initialTorch,
    sta: initialSta,
    worldSeed: defaultWorldSeed,
    cooldownUntil: 0,
    exits: { N: true, E: true, S: true, W: true },

    async init(userId: string, repo?: PositionRepo) {
      const effectiveRepo = repo ?? new LocalStoragePositionRepo()
      const existing = await effectiveRepo.loadCurrent(userId)
      if (existing) {
        set({
          userId,
          pos: existing.pos,
          facing: existing.facing,
          torch: existing.torch,
          sta: existing.sta,
          worldSeed: existing.worldSeed,
          playerState: 'Idle',
          lastError: undefined,
        })
      } else {
        const doc: CurrentDoc = {
          pos: defaultPos,
          torch: initialTorch,
          sta: initialSta,
          worldSeed: defaultWorldSeed,
          updatedAt: Date.now(),
          version: 1,
        }
        await effectiveRepo.saveCurrent(userId, doc)
        set({ userId, ...doc, playerState: 'Idle' })
      }
      get().refreshExits()
    },

    setState(s: Partial<GameSlice>) {
      set(s)
    },

    refreshExits() {
      const { pos, worldSeed } = get()
      const exits = openExits(pos.x, pos.y, worldSeed)
      set({ exits })
    },
  }))
)


