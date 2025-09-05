import { useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "../game/state";
import type { PlayerState as State } from "../game/types";

type Context = Partial<{
  roomName: string;
  roomType: 'Empty' | 'Trap' | 'Treasure' | 'Monster' | 'Shop';
  hp: number;
  mp: number;
  sta: number;
  torch: number;     // 0~100
  danger: boolean;
  // 세션 시작/재시작 연출을 위한 힌트
  sessionStartKind: 'start' | 'restart';
}>;

type Props = {
  state: State;
  context?: Context;
  /** 임시로 현재 상태 문구를 덮어쓰고 싶을 때 */
  override?: string | null;
  /** 타이핑 속도(밀리초/문자). 0이면 즉시 출력 */
  typingMs?: number;
  className?: string;
};

function pickRandom(messages: string[]): string {
  if (messages.length === 0) return ''
  const idx = Math.floor(Math.random() * messages.length)
  return messages[idx]
}

function resolveRoomType(ctx: Context): Context['roomType'] | undefined {
  if (ctx.roomType) return ctx.roomType
  const key = ctx.roomName
  switch (key) {
    case 'roomEmpty':
      return 'Empty'
    case 'roomTrap':
      return 'Trap'
    case 'roomTreasure':
      return 'Treasure'
    case 'roomMonster':
      return 'Monster'
    case 'roomShop':
      return 'Shop'
    default:
      return undefined
  }
}

const stateLines = (state: State, ctx: Context = {}): string => {
  const { roomName, hp, sta, torch, danger } = ctx;

  switch (state) {
    case "Game.Start":
      return pickRandom([
        '차가운 바닥 위, 몸을 웅크린 채 의식을 되찾는다.',
        '얼어붙은 공기 속에서 눈을 뜨자, 낯선 미궁의 천장이 보인다.',
      ]);
    case "Game.Restart":
      return pickRandom([
        '모닥불 앞, 움츠린 채 잠들어 있던 몸을 천천히 일으켜 세운다.',
        '불씨가 꺼져가는 소리를 들으며, 다시 눈을 뜬다.',
      ]);
    case "Idle":
      return `모험가는 방 한가운데서 숨을 고른다.`;
    case "Move.Select":
      return `갈림길 앞. 어느 문을 택할 것인가? (동/서/남/북)`;
    case "Move.Entering":
      {
        const rt = resolveRoomType(ctx)
        if (rt === 'Empty') {
          return pickRandom([
            '좁은 통로 끝에 아무 것도 없는 공간이 드러난다.',
            '돌벽만 서 있는 텅 빈 방. 메아리만 남아 있다.',
          ])
        }
        if (rt === 'Trap') {
          return pickRandom([
            '발밑이 꺼지며 날카로운 가시에 찔린다. 피가 바닥에 스며든다.',
            '바닥 전체에 가시가 솟아올라, 발 디딜 틈조차 없다.',
          ])
        }
        if (rt === 'Treasure') {
          return pickRandom([
            '길 끝에 오래된 상자가 홀로 놓여 있다.',
            '먼지 낀 보물상자 하나가 어둠 속에서 희미하게 빛난다.',
          ])
        }
        if (rt === 'Monster') {
          return pickRandom([
            '그림자가 일어서며 괴물의 숨소리가 울린다.',
            '어둠 속 붉은 눈이 번뜩이며 괴물이 모습을 드러낸다.',
          ])
        }
        // Shop 또는 미지정: 기존 기본 문구
        return `${roomName ?? "이름 모를 방"}으로 천천히 발을 들인다…`
      }
    case "Room.Explore":
      return `주위를 살핀다. 바닥, 벽, 천장까지. 단서가 있을지도 모른다.`;
    case "Event":
      return danger
        ? `등골이 서늘해진다. 무언가가 움직였다.`
        : `미세한 기척. 함정일까, 기회일까?`;
    case "Combat":
      return `그림자 속에서 적이 모습을 드러낸다. 자세를 가다듬어라.`;
    case "Resting":
      return pickRandom([
        '횃불을 벽에 걸어두고, 차가운 돌벽에 등을 기댄다.',
        '한숨 돌리며 고개를 젖히자, 돌천장에서 물방울이 뚝뚝 떨어진다.',
        `잠시 숨을 고른다. [HP ${hp ?? "?"}] [STA ${sta ?? "?"}] [Torch ${torch ?? "?"}%]`,
      ]);
    case "GameOver":
      return `불빛이 사그라든다. 미궁은 또 한 명의 방랑자를 삼켰다.`;
    default:
      return `낯선 정적이 내려앉는다.`;
  }
};

export function NarrationBar({
  state,
  context,
  override,
  typingMs = 14,
  className = "",
}: Props) {
  // 재시작 시 나레이션 1회성 표기를 위해 전역 상태(sessionStartKind)도 참조
  const storeSessionStartKind = useGameStore(s => s.sessionStartKind);
  const playerStateFromStore = useGameStore(s => s.playerState);
  const startOnceRef = useRef(false);

  const effectiveSessionStartKind = context?.sessionStartKind ?? storeSessionStartKind;
  const sessionStartForThisRender = !startOnceRef.current ? effectiveSessionStartKind : undefined;

  const targetText = useMemo(() => {
    if (override && override.trim().length > 0) return override;
    const merged = { ...context, sessionStartKind: sessionStartForThisRender } as typeof context;
    const effectiveState = playerStateFromStore ?? state;
    return stateLines(effectiveState, merged);
  }, [override, state, context, sessionStartForThisRender, playerStateFromStore]);

  // 시작/재시작 문구는 한 번만 사용
  useEffect(() => {
    if (sessionStartForThisRender) {
      startOnceRef.current = true;
    }
  }, [sessionStartForThisRender]);

  const [display, setDisplay] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const iRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  // 타이핑 효과
  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setDisplay("");
    iRef.current = 0;

    if (typingMs <= 0) {
      setDisplay(targetText);
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    const tick = () => {
      iRef.current += 1;
      setDisplay(targetText.slice(0, iRef.current));
      if (iRef.current < targetText.length) {
        timerRef.current = window.setTimeout(tick, typingMs);
      } else {
        setIsTyping(false);
      }
    };
    timerRef.current = window.setTimeout(tick, typingMs);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [targetText, typingMs]);

  // 스페이스/엔터로 스킵
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isTyping) return;
      if (e.key === " " || e.key === "Enter") {
        setDisplay(targetText);
        setIsTyping(false);
        if (timerRef.current) {
          window.clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isTyping, targetText]);

  return (
    <div
      className={[
        "w-full",
        "backdrop-blur-sm bg-zinc-900/60 border border-zinc-800",
        "rounded-xl shadow-lg",
        "px-4 sm:px-6 py-3 sm:py-4 min-h-[72px] sm:min-h-[84px]",
        "relative overflow-hidden",
        className,
      ].join(" ")}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="pointer-events-none absolute inset-x-0 -top-12 h-24 bg-gradient-to-b from-amber-500/10 to-transparent" />
      <p className="text-zinc-100 text-base sm:text-lg leading-relaxed">
        {display}
        {isTyping ? <span className="animate-pulse">▌</span> : null}
      </p>

      {typeof context?.torch === "number" && context.torch <= 20 && (
        <div className="mt-2 text-amber-300/80 text-xs sm:text-sm">
          횃불이 희미해진다… (Torch {context.torch}%)
        </div>
      )}
    </div>
  );
}


