import React from "react";
import { ChevronRight, Flame } from "lucide-react";
import { useI18n } from "../../../i18n/i18n";

export function Marquee() {
	const { t } = useI18n();
	return (
		<div className="border-y border-zinc-900/80 bg-zinc-900/40">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-sm py-2 flex items-center gap-3 text-zinc-300">
				<Flame className="w-4 h-4" />
				<span className="truncate">{t("marquee.event")}</span>
				<ChevronRight className="w-4 h-4 ml-auto" />
			</div>
		</div>
	);
}


