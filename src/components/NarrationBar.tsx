import { useEffect, useMemo, useRef, useState } from "react";
import type { PlayerState as State } from "../game/types";

type Context = Partial<{
  roomName: string;
  hp: number;
  mp: number;
  sta: number;
  torch: number;     // 0~100
  danger: boolean;
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

const stateLines = (state: State, ctx: Context = {}): string => {
  const { roomName, hp, sta, torch, danger } = ctx;

  switch (state) {
    case "Idle":
      return `모험가는 ${roomName ?? "어두운 방"} 한가운데서 숨을 고른다.`;
    case "Move.Select":
      return `갈림길 앞. 어느 문을 택할 것인가? (동/서/남/북)`;
    case "Move.Entering":
      return `${roomName ?? "이름 모를 방"}으로 천천히 발을 들인다…`;
    case "Room.Explore":
      return `주위를 살핀다. 바닥, 벽, 천장까지. 단서가 있을지도 모른다.`;
    case "Event":
      return danger
        ? `등골이 서늘해진다. 무언가가 움직였다.`
        : `미세한 기척. 함정일까, 기회일까?`;
    case "Combat":
      return `그림자 속에서 적이 모습을 드러낸다. 자세를 가다듬어라.`;
    case "Resting":
      return `잠시 숨을 고른다. [HP ${hp ?? "?"}] [STA ${sta ?? "?"}] [Torch ${torch ?? "?"}%]`;
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
  const targetText = useMemo(
    () => (override && override.trim().length > 0 ? override : stateLines(state, context)),
    [override, state, context]
  );

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


