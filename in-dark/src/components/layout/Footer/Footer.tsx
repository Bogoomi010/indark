import React from "react";
import { useI18n } from "../../../i18n/i18n";

export function Footer() {
	const { t } = useI18n();
	return (
		<footer className="border-t border-zinc-900/70 bg-zinc-950/80">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-zinc-400">
				<p>© 2025 SOULWORLD Studio</p>
				<div className="flex items-center gap-4">
					<a href="#" className="hover:text-zinc-200">{t("footer.terms")}</a>
					<a href="#" className="hover:text-zinc-200">{t("footer.privacy")}</a>
					<a href="#" className="hover:text-zinc-200">{t("footer.contact")}</a>
				</div>
			</div>
		</footer>
	);
}


