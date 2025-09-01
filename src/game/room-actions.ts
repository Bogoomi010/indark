export type State =
  | "Idle"
  | "Move.Select"
  | "Move.Entering"
  | "Room.Explore"
  | "Combat"
  | "Event"
  | "Resting"
  | "GameOver";

export type RoomType = "Empty" | "Trap" | "Shop" | "Monster" | "Treasure";

type GuardFn = () => boolean;
type Cost = Partial<{
  hp: number; mp: number; sta: number; torch: number;
  item?: Record<string, number>; gold?: number;
}>;

export type ActionSpec = {
  label: string;
  hotkey?: string;
  next: State | ((ctx: any) => State);
  guard?: GuardFn;
  cost?: Cost;
  onExec?: (ctx: any) => void;
  group?: "primary" | "secondary";
};

export const ROOM_ACTIONS: Record<RoomType, ActionSpec[]> = {
  Empty: [
    { label: "살펴보기", hotkey: "E", next: "Room.Explore",
      guard: () => hasTorch(), cost: { sta: 1, torch: 1 }, group: "primary" },
    { label: "쉬기", hotkey: "R", next: "Resting",
      cost: { torch: 1 }, group: "secondary" },
  ],

  Trap: [],

  Shop: [
    { label: "거래 시작", hotkey: "E", next: "Event", group: "primary" },
    { label: "구매", next: "Event", group: "primary" },
    { label: "판매", next: "Event", group: "primary" },
    { label: "떠나기", next: "Idle", group: "secondary" },
  ],

  Monster: [
    { label: "전투 시작", hotkey: "Space", next: "Combat",
      guard: () => isMonsterHere(), group: "primary" },
    { label: "도주", hotkey: "Shift+Space",
      next: (ctx) => (ctx.roll?.() > 0.5 ? "Move.Select" : "Combat"),
      cost: { sta: 3 }, group: "secondary" },
  ],

  Treasure: [
    { label: "상자 조사", hotkey: "E", next: "Event",
      guard: () => hasTorch(), cost: { sta: 1, torch: 1 }, group: "primary" },
    { label: "개봉", next: "Room.Explore",
      guard: () => hasKey() || hasTool("Lockpick"), group: "primary" },
    { label: "강제개봉", next: "Event", cost: { sta: 2 }, group: "secondary" },
  ],
};

// 가드/유틸 – 실제 프로젝트 컨텍스트로 교체
const hasTorch = () => true;
const hasTool = (_: string) => false;
const isMonsterHere = () => true;
const hasKey = () => false;


