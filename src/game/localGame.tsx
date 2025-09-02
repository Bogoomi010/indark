import React, { createContext, useCallback, useContext, useMemo } from 'react'
import type { Dir, Vec2 } from './types'
import { useGameStore } from './state'
import { tryMove } from './flow'
import { FirestorePositionRepo } from '../services/positionRepo.firestore'

type LocalGameValue = {
  pos: Vec2
  worldSeed: string
  exits: { N: boolean; E: boolean; S: boolean; W: boolean }
  move: (dir: Dir) => void
  torch: number
  sta: number
}

const LocalGameContext = createContext<LocalGameValue | null>(null)

export function GameLocalProvider({ children }: { children: React.ReactNode }) {
  // 스토어 값을 그대로 바라보는 호환 레이어
  const { pos, worldSeed, exits, torch, sta } = useGameStore()
  const move = useCallback((dir: Dir) => {
    void tryMove(dir, { repo: new FirestorePositionRepo() })
  }, [])
  const value = useMemo<LocalGameValue>(() => ({ pos, worldSeed, exits, move, torch, sta }), [pos, worldSeed, exits, move, torch, sta])
  return <LocalGameContext.Provider value={value}>{children}</LocalGameContext.Provider>
}

export function useLocalGame(): LocalGameValue {
  const ctx = useContext(LocalGameContext)
  if (!ctx) throw new Error('useLocalGame must be used within GameLocalProvider')
  return ctx
}


