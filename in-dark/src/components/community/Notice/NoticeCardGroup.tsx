import React, { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card";
import { useI18n } from "../../../i18n/i18n";

const Notice = memo(function Notice({ title, body }: { title: string; body: string }) {
	return (
		<div className="p-3 rounded-xl bg-zinc-800/40">
			<p className="text-sm font-medium">{title}</p>
			<p className="text-xs text-zinc-400 mt-1">{body}</p>
		</div>
	);
});

export function NoticeCardGroup() {
	const { t } = useI18n();
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">{t("notice.title")}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2 text-sm text-zinc-300">
				<Notice title={t("notice.maintenance.title")} body={t("notice.maintenance.body")} />
				<Notice title={t("notice.season.title")} body={t("notice.season.body")} />
			</CardContent>
		</Card>
	);
}


