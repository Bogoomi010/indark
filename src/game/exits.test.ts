import { describe, it, expect } from 'vitest'
import { openExits } from './exits'

describe('openExits', () => {
  it('동일 입력은 동일 출력(결정적)', () => {
    const a = openExits(0, 0, 'seed-1')
    const b = openExits(0, 0, 'seed-1')
    expect(a).toEqual(b)
  })

  it('최소 한 개는 열려야 한다', () => {
    const r = openExits(10, -7, 'seed-2')
    expect(r.N || r.E || r.S || r.W).toBe(true)
  })

  it('양방향 일치(N<->S, E<->W)', () => {
    const r = openExits(3, 5, 'seed-3')
    const rSouthNeighbor = openExits(3, 6, 'seed-3')
    // N(3,5) == S(3,4+1) => S of south neighbor is NOT correct; per rule we defined:
    // S(3,5) == N(3,6) and W(3,5) == E(2,5)
    expect(r.S).toBe(rSouthNeighbor.N)
    expect(r.W).toBe(openExits(2, 5, 'seed-3').E)
  })
})


