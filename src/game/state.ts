import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { CurrentDoc, Dir, PlayerState, Vec2 } from './types'
import { defaultWorldSeed, initialSta, initialTorch, initialHp, initialMp } from './types'
import type { PositionRepo } from '../services/positionRepo'
import { FirestorePositionRepo } from '../services/positionRepo.firestore'
import { openExits } from './exits'

export interface GameSlice {
  userId: string
  playerState: PlayerState
  pos: Vec2
  facing?: Dir
  torch: number
  sta: number
  hp: number
  mp: number
  worldSeed: string
  lastError?: string
  cooldownUntil: number

  exits: { N: boolean; E: boolean; S: boolean; W: boolean }
  // 이번 세션이 "처음 시작"인지 "재시작"인지 구분 (UI용)
  sessionStartKind?: 'start' | 'restart'
  // 세션 동안 방문한 방 좌표 집합 (비영속)
  visitedRooms: Record<string, boolean>
  // 씬 이미지를 임시로 덮어쓰는 경로 (예: 이동 중 연출)
  tempSceneSrc?: string
  // 방별 이벤트 트리거 상태 (true: 이벤트 활성, false: 종료됨)
  roomEventOn: Record<string, boolean>

  // actions
  init(userId: string, repo?: PositionRepo): Promise<void>
  setState(s: Partial<GameSlice>): void
  refreshExits(): void
  markRoomVisited(pos: Vec2): void
}

const defaultPos: Vec2 = { x: 0, y: 0 }

export const useGameStore = create<GameSlice>()(
  devtools((set: (partial: Partial<GameSlice> | ((state: GameSlice) => Partial<GameSlice>)) => void, get: () => GameSlice) => ({
    userId: 'mock-user',
    playerState: 'Idle',
    pos: defaultPos,
    torch: initialTorch,
    sta: initialSta,
    hp: initialHp,
    mp: initialMp,
    worldSeed: defaultWorldSeed,
    cooldownUntil: 0,
    exits: { N: true, E: true, S: true, W: true },
    visitedRooms: { [`${defaultPos.x},${defaultPos.y}`]: true },
    tempSceneSrc: undefined,
    roomEventOn: {},

    async init(userId: string, repo?: PositionRepo) {
      const effectiveRepo = repo ?? new FirestorePositionRepo()
      const existing = await effectiveRepo.loadCurrent(userId)
      // 리셋 직후 1회성 플래그(localStorage)
      const RESET_FLAG_KEY = 'indark_just_reset'
      const resetFlag = typeof window !== 'undefined' ? window.localStorage.getItem(RESET_FLAG_KEY) : null
      if (existing) {
        set({
          userId,
          pos: existing.pos,
          facing: existing.facing,
          torch: existing.torch,
          sta: existing.sta,
          hp: existing.hp,
          mp: existing.mp,
          worldSeed: existing.worldSeed,
          cooldownUntil: existing.cooldownUntil ?? 0,
          playerState: resetFlag ? 'Game.Start' : 'Game.Restart',
          lastError: undefined,
          sessionStartKind: resetFlag ? 'start' : 'restart',
        })
      } else {
        const doc: CurrentDoc = {
          pos: defaultPos,
          torch: initialTorch,
          sta: initialSta,
          hp: initialHp,
          mp: initialMp,
          worldSeed: defaultWorldSeed,
          cooldownUntil: 0,
          updatedAt: Date.now(),
          version: 1,
        }
        await effectiveRepo.saveCurrent(userId, doc)
        // 최초 시작: 시작 방의 이벤트는 비활성(false)로 시작한다 → Empty처럼 보임
        const startKey = `${doc.pos.x},${doc.pos.y}`
        set({ userId, ...doc, playerState: 'Game.Start', sessionStartKind: 'start', roomEventOn: { [startKey]: false } })
      }
      if (resetFlag && typeof window !== 'undefined') {
        try { window.localStorage.removeItem('indark_just_reset') } catch {}
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

    markRoomVisited(p: Vec2) {
      const key = `${p.x},${p.y}`
      const vr = { ...get().visitedRooms }
      if (!vr[key]) vr[key] = true
      set({ visitedRooms: vr })
    },
  }))
)


