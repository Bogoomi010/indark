import { useCallback, useMemo, useState } from "react";
import {
  Header,
  Hero,
  Marquee,
  NewsSection,
  SceneImageSection,
  InventoryCard,
  CharacterStatusCard,
  GameMapCard,
  PlayerActionControls,
  CommunityCard,
  ChatCard,
  NoticeCardGroup,
  Footer,
} from "../components";
import { GameLocalProvider, useLocalGame } from "../game/localGame";

export default function GamePortalPage() {
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
  const { pos } = useLocalGame();
  const changeKey = useMemo(() => `${pos.x},${pos.y}`,[pos.x,pos.y]);

  const handleSend = useCallback((msg: string) => {
    setLog((l) => [...l, `[YOU] ${msg}`]);
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-950 via-black to-black text-zinc-100 font-body">
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <Hero />
      <Marquee />

      <main id="game" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* 수정 포인트(폭/높이/브레이크포인트): 씬 이미지는 컨테이너 내부, 고정 높이 */}
        <div className="w-full h-[40vh] mb-4">
          <SceneImageSection changeKey={changeKey} variant="dungeonEntrance" className="w-full h-full" imageClassName="object-cover" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)_360px] gap-4">
          <section className="order-2 xl:order-1 space-y-4">
            <GameMapCard />
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


