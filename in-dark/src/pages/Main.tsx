import { useCallback, useState } from "react";
import {
  Header,
  Hero,
  Marquee,
  NewsSection,
  SceneImageSection,
  InventoryCard,
  CharacterStatusCard,
  GameMapCard,
  MapControls,
  CommunityCard,
  ChatCard,
  NoticeCardGroup,
  Footer,
} from "../components";

export default function GamePortalPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [log, setLog] = useState<string[]>([
    "[SYSTEM] 미궁 입장에 성공했습니다.",
    "[TIP] 적의 뒤를 잡으면 추가 피해를 입힙니다.",
    "[LOOT] 오래된 상자에서 '녹슨 열쇠'를 획득!",
  ]);

  const handleSend = useCallback((msg: string) => {
    setLog((l) => [...l, `[YOU] ${msg}`]);
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-950 via-black to-black text-zinc-100 font-body">
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <Hero />
      <Marquee />

      <main id="game" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)_360px] gap-4">
          <section className="order-2 xl:order-1 space-y-4">
            <InventoryCard />
            <GameMapCard />
            <CharacterStatusCard />
          </section>

          <section className="order-1 xl:order-2">
            <div className="w-full">
              <SceneImageSection variant="dungeonEntrance" className="w-full" />
            </div>
            <MapControls />
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


