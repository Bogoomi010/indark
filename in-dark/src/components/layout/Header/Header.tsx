import React, { useCallback } from "react";
import { Crown, Download, Menu, Play, Globe } from "lucide-react";
import { Button } from "../../ui/Button";
import { Badge } from "../../ui/Badge";
import { useI18n } from "../../../i18n/i18n";

interface HeaderProps { menuOpen: boolean; setMenuOpen: (v: boolean) => void; showActions?: boolean }

export function Header({ menuOpen, setMenuOpen, showActions = false }: HeaderProps) {
	const toggleMenu = useCallback(() => setMenuOpen(!menuOpen), [menuOpen, setMenuOpen]);
  const { t, locale, setLocale } = useI18n();

  const cycleLocale = useCallback(() => {
    const order = ["en", "ko", "de"] as const;
    const idx = order.indexOf(locale as any);
    const next = order[(idx + 1) % order.length];
    setLocale(next);
  }, [locale, setLocale]);
	return (
		<header className="sticky top-0 z-40 backdrop-blur bg-zinc-950/80 border-b border-zinc-900">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 grid place-items-center">
						<Crown className="w-5 h-5" />
					</div>
					<span className="text-lg sm:text-xl font-semibold tracking-wide font-display">{t("brand.title")}</span>
					<Badge className="ml-2 bg-zinc-800/80">Alpha</Badge>
				</div>
				<nav className="hidden md:flex items-center gap-6 text-sm text-zinc-300 font-display">
					<a className="hover:text-white transition" href="#home">{t("nav.home")}</a>
					<a className="hover:text-white transition" href="#game">{t("nav.game")}</a>
					<a className="hover:text-white transition" href="#community">{t("nav.community")}</a>
					<a className="hover:text-white transition" href="#news">{t("nav.news")}</a>
				</nav>
				<div className="relative ml-4">
					<details className="group">
						<summary className="list-none cursor-pointer rounded-2xl bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-xs font-display inline-flex items-center gap-1">
							<Globe className="w-4 h-4" /> {locale.toUpperCase()}
						</summary>
						<div className="absolute right-0 mt-2 w-28 rounded-md border border-zinc-800 bg-zinc-900 shadow-lg text-xs">
							<button onClick={() => setLocale("en")} className="w-full text-left px-3 py-2 hover:bg-zinc-800">EN - English</button>
							<button onClick={() => setLocale("ko")} className="w-full text-left px-3 py-2 hover:bg-zinc-800">KO - 한국어</button>
							<button onClick={() => setLocale("de")} className="w-full text-left px-3 py-2 hover:bg-zinc-800">DE - Deutsch</button>
						</div>
					</details>
				</div>
				{showActions && (
					<div className="hidden md:flex items-center gap-3">
						<Button className="rounded-2xl"><Download className="mr-2 w-4 h-4" />다운로드</Button>
						<Button className="rounded-2xl font-semibold"><Play className="mr-2 w-4 h-4" />바로 플레이</Button>
					</div>
				)}
				<Button onClick={toggleMenu} className="md:hidden bg-transparent hover:bg-zinc-800/60" aria-label="메뉴 열기">
					<Menu className="w-5 h-5" />
				</Button>
			</div>
			{menuOpen && (
				<div className="md:hidden border-t border-zinc-800 bg-zinc-950/90 px-4 py-3 grid gap-2 font-display">
					<a className="py-1" href="#home">{t("nav.home")}</a>
					<a className="py-1" href="#game">{t("nav.game")}</a>
					<a className="py-1" href="#community">{t("nav.community")}</a>
					<a className="py-1" href="#news">{t("nav.news")}</a>
					<Button onClick={cycleLocale} className="mt-2 w-max rounded-2xl bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-xs">
						{locale.toUpperCase()}
					</Button>
				</div>
			)}
		</header>
	);
}


