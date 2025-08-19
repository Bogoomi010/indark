import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "en" | "ko" | "de";

type Translations = Record<string, Record<Locale, string>>;

const translations: Translations = {
	"brand.title": {
		en: "SOULWORLD",
		ko: "SOULWORLD",
		de: "SOULWORLD",
	},
	"nav.home": {
		en: "Home",
		ko: "홈",
		de: "Start",
	},
	"nav.game": {
		en: "Game",
		ko: "게임",
		de: "Spiel",
	},
	"nav.community": {
		en: "Community",
		ko: "커뮤니티",
		de: "Community",
	},
	"nav.news": {
		en: "News",
		ko: "뉴스",
		de: "News",
	},
	"hero.title": {
		en: "Explore the Labyrinth of Darkness",
		ko: "어둠의 미궁을 탐험하라",
		de: "Erkunde das Labyrinth der Finsternis",
	},
	"hero.subtitle": {
		en: "Real-time dungeon exploration, collection features, community and chat — all in one screen. Just a browser and you're ready.",
		ko: "실시간 던전 탐험, 수집 요소, 커뮤니티와 채팅까지 한 화면에서. 브라우저만 있으면 준비 완료.",
		de: "Echtzeit-Dungeon-Erkundung, Sammelfunktionen, Community und Chat – alles auf einem Bildschirm. Ein Browser genügt.",
	},
	"hero.cta.start": { en: "Get Started", ko: "시작하기", de: "Los geht's" },
	"hero.cta.patch": { en: "Patch Notes", ko: "패치 노트", de: "Patchnotizen" },

	"marquee.event": {
		en: "Event: 'King of the Underground Lake' raid open until Aug 30 — limited rewards",
		ko: "이벤트: 8월 30일까지 '지하호수 왕' 레이드 오픈 — 한정 보상 지급",
		de: "Event: 'König des Untergrundsees' Raid bis 30. Aug geöffnet — limitierte Belohnungen",
	},

	"inventory.title": { en: "Inventory", ko: "인벤토리", de: "Inventar" },
	"character.title": { en: "Character Status", ko: "캐릭터 상태", de: "Charakterstatus" },
	"character.badge.coldRes": { en: "Cold Resist +12%", ko: "얼음 저항 +12%", de: "Kälte-Resistenz +12%" },
	"character.badge.bleedImmune": { en: "Bleed Immune", ko: "출혈 면역", de: "Blutung Immun" },

	"map.hud.coords": { en: "Coords", ko: "좌표", de: "Koordinaten" },
	"map.hud.enemies": { en: "Enemies", ko: "적 감지", de: "Gegner" },
	"controls.attack": { en: "Attack", ko: "공격", de: "Angriff" },
	"controls.guard": { en: "Guard", ko: "가드", de: "Blocken" },
	"controls.skill": { en: "Skill", ko: "스킬", de: "Fähigkeit" },

	"community.title": { en: "Community & Chat", ko: "커뮤니티 & 채팅", de: "Community & Chat" },
	"community.search": { en: "Search posts", ko: "게시글 검색", de: "Beiträge suchen" },

	"chat.title": { en: "Chat", ko: "채팅", de: "Chat" },
	"chat.placeholder": { en: "Type a message...", ko: "메시지 입력...", de: "Nachricht eingeben..." },
	"chat.send": { en: "Send", ko: "보내기", de: "Senden" },

	"notice.title": { en: "Notices", ko: "공지", de: "Mitteilungen" },
	"notice.maintenance.title": { en: "Scheduled Maintenance", ko: "정기 점검", de: "Geplante Wartung" },
	"notice.maintenance.body": { en: "Aug 21 (Wed) 02:00–06:00 server maintenance", ko: "8월 21일(수) 02:00–06:00 서버 점검", de: "21. Aug (Mi) 02:00–06:00 Serverwartung" },
	"notice.season.title": { en: "Season Rewards", ko: "시즌 보상", de: "Saisonbelohnungen" },
	"notice.season.body": { en: "Combat points settlement on Aug 30", ko: "8월 30일 전투 포인트 정산 예정", de: "Abrechnung der Kampfpunkte am 30. Aug" },

	"news.patchNote": { en: "Patch Notes", ko: "패치 노트", de: "Patchnotizen" },
	"news.body": { en: "New room rules, AI improvements, and loot table adjustments included.", ko: "새로운 방 생성 규칙과 적 AI 개선, 드랍 테이블 조정이 포함되었습니다.", de: "Neue Raumregeln, KI-Verbesserungen und Beutentabellen-Anpassungen enthalten." },

	"footer.terms": { en: "Terms", ko: "이용약관", de: "Nutzungsbedingungen" },
	"footer.privacy": { en: "Privacy", ko: "개인정보처리방침", de: "Datenschutz" },
	"footer.contact": { en: "Contact", ko: "문의", de: "Kontakt" },
};

interface I18nContextValue {
	locale: Locale;
	setLocale: (loc: Locale) => void;
	t: (key: keyof typeof translations) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
	const [locale, setLocaleState] = useState<Locale>(() => {
		const stored = (typeof window !== "undefined" && window.localStorage.getItem("locale")) as Locale | null;
		return stored || "ko";
	});

	const setLocale = useCallback((loc: Locale) => {
		setLocaleState(loc);
		try { window.localStorage.setItem("locale", loc); } catch {}
	}, []);

	const t = useCallback((key: keyof typeof translations) => {
		const entry = translations[key];
		if (!entry) return key as unknown as string;
		return entry[locale] ?? entry.ko;
	}, [locale]);

	const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

	useEffect(() => {
		// no-op, keeps react fast refresh happy when storage changes
	}, [locale]);

	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
	const ctx = useContext(I18nContext);
	if (!ctx) throw new Error("useI18n must be used within I18nProvider");
	return ctx;
}


