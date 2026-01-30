export type Vec2 = { x: number; y: number };

export type Dir = 'N' | 'E' | 'S' | 'W';

export type PlayerState =
  | 'Game.Start'
  | 'Game.Restart'
  | 'Idle'
  | 'Move.Select'
  | 'Move.Entering'
  | 'Room.Explore'
  | 'Combat'
  | 'Event'
  | 'Resting'
  | 'GameOver';

export type InventorySlot = { slot: number; itemId: string | null; qty: number }

export type Equipment = { weapon: string | null; armor: string | null }

export interface CurrentDoc {
  pos: Vec2;
  facing?: Dir;
  torch: number;
  sta: number;
  hp: number;
  mp: number;
  gold: number;
  inventory: InventorySlot[];
  equipment: Equipment;
  worldSeed: string;
  cooldownUntil: number;
  updatedAt: number;
  version: number;
}

export const initialTorch = 100;
export const initialSta = 100;
export const initialHp = 100;
export const initialMp = 50;
export const defaultWorldSeed = 's-2025Q3';
export const moveCooldownMs = 300;

export function step(pos: Vec2, dir: Dir): Vec2 {
  switch (dir) {
    case 'N':
      return { x: pos.x, y: pos.y - 1 };
    case 'E':
      return { x: pos.x + 1, y: pos.y };
    case 'S':
      return { x: pos.x, y: pos.y + 1 };
    case 'W':
      return { x: pos.x - 1, y: pos.y };
  }
}


