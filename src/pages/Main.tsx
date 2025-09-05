import { useCallback, useMemo, useState } from "react";
import {
  Header,
  Marquee,
  NewsSection,
  SceneImageSection,
  InventoryCard,
  CharacterStatusCard,
  PlayerActionControls,
  CommunityCard,
  ChatCard,
  NoticeCardGroup,
  Footer,
} from "../components";
import { GameLocalProvider, useLocalGame } from "../game/localGame";
import { useAuth } from "../auth/AuthProvider";
import { useEffect, useRef } from "react";
import { useGameStore } from "../game/state";
import { FirestorePositionRepo } from "../services/positionRepo.firestore";
import { roomTypeFor } from "../game/room";
import HudMini from "../components/HudMini";
import { NarrationBar } from "../components/NarrationBar";

export default function GamePortalPage() {
  const { user } = useAuth();
  const init = useGameStore(s => s.init);
  useEffect(() => {
    const uid = user?.uid ?? 'anon';
    void init(uid, new FirestorePositionRepo());
  }, [user?.uid, init]);
  return (
    <GameLocalProvider>
      <GamePortalInner />
    </GameLocalProvider>
  );
}

function GamePortalInner() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [log, setLog] = useState<string[]>([
    "[SYSTEM] 미궁 입장에 성공했습니다.",
    "[TIP] 적의 뒤를 잡으면 추가 피해를 입힙니다.",
    "[LOOT] 오래된 상자에서 '녹슨 열쇠'를 획득!",
  ]);
  const { pos, worldSeed } = useLocalGame();
  const playerState = useGameStore(s => s.playerState);
  const loggedCurrentOnceRef = useRef(false);
  const changeKey = useMemo(() => `${pos.x},${pos.y}`,[pos.x,pos.y]);
  const roomVariant: string = useMemo(() => {
    const type = roomTypeFor(pos.x, pos.y, worldSeed);
    const map: Record<string, string> = {
      Empty: 'roomEmpty',
      Trap: 'roomTrap',
      Shop: 'roomShop',
      Monster: 'roomMonster',
      Treasure: 'roomTreasure',
    };
    return map[type];
  }, [pos.x, pos.y, worldSeed]);

  // 앱 진입 직후 현재 방 정보도 터미널로 1회 로깅
  useEffect(() => {
    if (loggedCurrentOnceRef.current) return;
    const type = roomTypeFor(pos.x, pos.y, worldSeed);
    try {
      // eslint-disable-next-line no-console
      console.log(`[InDark] Current room → type=${type}, state=${playerState}`);
      fetch('/__indark-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: 'current-room', payload: { roomType: type, playerState, pos } }),
      }).catch(() => {});
    } finally {
      loggedCurrentOnceRef.current = true;
    }
  }, [pos.x, pos.y, worldSeed, playerState]);

  const handleSend = useCallback((msg: string) => {
    setLog((l) => [...l, `[YOU] ${msg}`]);
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-950 via-black to-black text-zinc-100 font-body">
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <Marquee />

      <main id="game" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* 수정 포인트(폭/높이/브레이크포인트): 씬 이미지는 컨테이너 내부, 고정 높이 */}
        <div className="w-full h-[40vh] mb-4">
          <SceneImageSection changeKey={changeKey} variant={roomVariant} className="w-full h-full" imageClassName="object-cover" />
        </div>
        <div className="w-full mb-6">
          <NarrationBar state={"Room.Explore"} context={{ roomName: roomVariant, torch: 100 }} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)_360px] gap-4">
          <section className="order-2 xl:order-1 space-y-4">
            <div>
              <HudMini />
            </div>
            <CharacterStatusCard />
          </section>

          <section className="order-1 xl:order-2 space-y-4">
            {/* 중앙: 액션/인벤토리 스택 */}
            <PlayerActionControls />
            <InventoryCard />
          </section>

          <section id="community" className="order-3 space-y-4">
            <CommunityCard />
            <ChatCard log={log} onSend={handleSend} />
            <NoticeCardGroup />
          </section>
        </div>
      </main>

      <NewsSection />
      <Footer />
    </div>
  );
}


