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

// legacy key (미사용)
// const LS_KEY = 'in-dark/local/current'

function hashString(input: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
  }
  return h >>> 0
}

export function GameLocalProvider({ children, userId = 'anon' }: { children: React.ReactNode; userId?: string }) {
  // 저장된 데이터 동기 조회 (초기 상태용)
  const readSaved = () => {
    try {
      const raw = localStorage.getItem(`in-dark/${userId}/current`)
      return raw ? (JSON.parse(raw) as { pos?: Vec2; worldSeed?: string; torch?: number; sta?: number }) : null
    } catch {
      return null
    }
  }

  const [worldSeed] = useState<string>(() => readSaved()?.worldSeed ?? defaultWorldSeed)
  const [pos, setPos] = useState<Vec2>(() => {
    const saved = readSaved()
    if (saved?.pos) return saved.pos
    const h = Math.abs(hashString(`${userId}:${worldSeed}`))
    const rx = 2 + (h % 6)
    const ry = 2 + ((h >> 3) % 6)
    return { x: rx, y: ry }
  })
  const [torch, setTorch] = useState<number>(() => {
    const saved = readSaved()
    return typeof saved?.torch === 'number' ? saved.torch : 15
  })
  const [sta, setSta] = useState<number>(() => {
    const saved = readSaved()
    return typeof saved?.sta === 'number' ? saved.sta : 15
  })
  const [lastDir, setLastDir] = useState<Dir | null>(null)

  // 초기 렌더 시 이미 랜덤 or 저장값으로 설정됨. 별도 로드 이펙트 불필요

  // persist
  useEffect(() => {
    localStorage.setItem(`in-dark/${userId}/current`, JSON.stringify({ pos, worldSeed, torch, sta }))
  }, [pos, worldSeed, torch, sta, userId])

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


