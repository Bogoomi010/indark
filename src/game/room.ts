export type RoomType = 'Empty' | 'Trap' | 'Shop' | 'Monster' | 'Treasure'

// 현재는 모든 방을 Empty처럼 동작시킵니다.

// 간단 결정 규칙: 좌표/시드 기반으로 방 타입 결정(가중치 포함)
function hashString(input: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
  }
  return h >>> 0
}

export function roomTypeFor(x: number, y: number, seed: string): RoomType {
  const h = hashString(`${seed}:${x},${y}:room`)
  const r = h % 100
  // 가중치: Empty 60, Monster 18, Trap 8, Shop 6, Treasure 8
  if (r < 60) return 'Empty'
  if (r < 78) return 'Monster'
  if (r < 86) return 'Trap'
  if (r < 92) return 'Shop'
  return 'Treasure'
}


