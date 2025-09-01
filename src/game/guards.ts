import type { Dir } from './types'

export function hasTorch(torch: number): boolean {
  return torch > 0
}

export function hasSTAForMove(sta: number): boolean {
  return sta > 0
}

// 간단 스텁: 출구가 열려있고 잠겨있지 않다고 가정하는 기본형
export function isExitOpen(_dir: Dir, exits: { N: boolean; E: boolean; S: boolean; W: boolean }): boolean {
  return exits[_dir]
}

export function isDoorLocked(_dir: Dir): boolean {
  return false
}

export function isExitBlocked(_dir: Dir): boolean {
  return false
}

export function torchLow(torch: number): boolean {
  return torch <= 10
}


