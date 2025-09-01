import type { Dir } from './types'

// 간단한 문자열 해시 (결정적): djb2 변형
function hashString(input: string): number {
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i)
    hash >>>= 0
  }
  return hash >>> 0
}

// 좌표/시드 기반 결정적 난수 [0,1)
function rng01(x: number, y: number, seed: string, salt: string): number {
  const base = `${seed}:${x},${y}:${salt}`
  const h = hashString(base)
  // xorshift32 한 번 섞기
  let v = h || 1
  v ^= v << 13
  v ^= v >>> 17
  v ^= v << 5
  v >>>= 0
  return (v % 10000) / 10000
}

export type ExitMap = { N: boolean; E: boolean; S: boolean; W: boolean }

// 규칙:
// - 같은 (x,y,seed) => 동일 결과
// - 최소 1개는 열림
// - 양방향 일치 보장(N<->S, E<->W)
export function openExits(x: number, y: number, seed: string): ExitMap {
  // 셀 간 대칭 일치:
  // N(x,y) 기준 -> S(x,y) = N(x, y+1)
  // E(x,y) 기준 -> W(x,y) = E(x-1, y)
  const nRaw = rng01(x, y, seed, 'N')
  const eRaw = rng01(x, y, seed, 'E')
  const sRaw = rng01(x, y + 1, seed, 'N')
  const wRaw = rng01(x - 1, y, seed, 'E')

  let N = nRaw >= 0.5
  let E = eRaw >= 0.5
  let S = sRaw >= 0.5
  let W = wRaw >= 0.5

  // 최소 하나는 열려야 함
  if (!N && !E && !S && !W) {
    const candidates: Array<[Dir, number]> = [
      ['N', nRaw],
      ['E', eRaw],
      ['S', sRaw],
      ['W', wRaw],
    ]
    candidates.sort((a, b) => b[1] - a[1])
    const top = candidates[0][0]
    if (top === 'N') N = true
    if (top === 'E') E = true
    if (top === 'S') S = true
    if (top === 'W') W = true
  }

  return { N, E, S, W }
}

// 이동 규칙 보조: 특정 방향(exclude)을 제외한 후보 중에서 결정적으로 하나를 고른다
export function pickOtherDir(x: number, y: number, seed: string, exclude: Dir): Dir {
  const candidates: Dir[] = ['N', 'E', 'S', 'W'].filter((d) => d !== exclude) as Dir[]
  // 각 후보에 대해 고유 salt를 사용해 점수화 후 최대값 선택
  let best: { dir: Dir; score: number } | null = null
  for (const d of candidates) {
    const score = rng01(x, y, seed, `P:${d}`)
    if (!best || score > best.score) best = { dir: d, score }
  }
  return best ? best.dir : candidates[0]
}


