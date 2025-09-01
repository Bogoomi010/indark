import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Vec2, Dir } from './types'
import { step, defaultWorldSeed } from './types'
import { openExits, pickOtherDir } from './exits'

type LocalGameValue = {
  pos: Vec2
  worldSeed: string
  exits: { N: boolean; E: boolean; S: boolean; W: boolean }
  move: (dir: Dir) => void
  torch: number
  sta: number
}

const LocalGameContext = createContext<LocalGameValue | null>(null)

const LS_KEY = 'in-dark/local/current'

export function GameLocalProvider({ children }: { children: React.ReactNode }) {
  const [pos, setPos] = useState<Vec2>({ x: 0, y: 0 })
  const [worldSeed] = useState<string>(defaultWorldSeed)
  const [torch, setTorch] = useState<number>(15)
  const [sta, setSta] = useState<number>(15)
  const [lastDir, setLastDir] = useState<Dir | null>(null)

  // load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) {
        const doc = JSON.parse(raw) as { pos?: Vec2; worldSeed?: string; torch?: number; sta?: number }
        if (doc.pos) setPos(doc.pos)
        // worldSeed는 고정
        if (typeof doc.torch === 'number') setTorch(doc.torch)
        if (typeof doc.sta === 'number') setSta(doc.sta)
      }
    } catch {}
  }, [])

  // persist
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ pos, worldSeed, torch, sta }))
  }, [pos, worldSeed, torch, sta])

  function opposite(d: Dir): Dir {
    switch (d) {
      case 'N': return 'S'
      case 'S': return 'N'
      case 'E': return 'W'
      case 'W': return 'E'
    }
  }

  // 기본 출구 + 규칙 보정: 방 도착 시, 돌아온 길(back)을 제외하고 최소 한 곳은 반드시 열림
  const exits = useMemo(() => {
    const base = openExits(pos.x, pos.y, worldSeed)
    if (!lastDir) return base
    const back = opposite(lastDir)
    const countOther = (base.N && back !== 'N' ? 1 : 0)
      + (base.E && back !== 'E' ? 1 : 0)
      + (base.S && back !== 'S' ? 1 : 0)
      + (base.W && back !== 'W' ? 1 : 0)
    if (countOther > 0) return base
    const mustOpen = pickOtherDir(pos.x, pos.y, worldSeed, back)
    return { ...base, [mustOpen]: true }
  }, [pos.x, pos.y, worldSeed, lastDir])

  const move = useCallback((dir: Dir) => {
    // 가드 단순화: 출구 열림만 체크
    if (!exits[dir]) return
    setPos((p) => step(p, dir))
    setTorch((v) => Math.max(0, v - 1))
    setSta((v) => Math.max(0, v - 1))
    setLastDir(dir)
  }, [exits])

  const value = useMemo<LocalGameValue>(() => ({ pos, worldSeed, exits, move, torch, sta }), [pos, worldSeed, exits, move, torch, sta])

  return <LocalGameContext.Provider value={value}>{children}</LocalGameContext.Provider>
}

export function useLocalGame(): LocalGameValue {
  const ctx = useContext(LocalGameContext)
  if (!ctx) throw new Error('useLocalGame must be used within GameLocalProvider')
  return ctx
}


