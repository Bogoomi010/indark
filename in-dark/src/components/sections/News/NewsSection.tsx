import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card";
import { Sparkles } from "lucide-react";
import { useI18n } from "../../../i18n/i18n";

export function NewsSection() {
	const { t } = useI18n();
	return (
		<section id="news" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-14">
			<div className="grid md:grid-cols-3 gap-4">
				{[1, 2, 3].map((i) => (
					<Card key={i}>
						<CardHeader>
							<CardTitle className="text-base flex items-center gap-2">
								<Sparkles className="w-4 h-4" />{t("news.patchNote")} #{i}
							</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-zinc-300">
							{t("news.body")}
						</CardContent>
					</Card>
				))}
			</div>
		</section>
	);
}


