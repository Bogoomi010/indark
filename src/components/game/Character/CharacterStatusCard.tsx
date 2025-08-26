import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card";
import { Badge } from "../../ui/Badge";
import { useI18n } from "../../../i18n/i18n";

const Stat = memo(function Stat({ label, value }: { label: string; value: number }) {
	const width = useMemo(() => `${Math.max(0, Math.min(100, value))}%`, [value]);
	return (
		<div>
			<div className="flex items-center justify-between mb-1">
				<span className="text-xs text-zinc-400">{label}</span>
				<span className="text-xs font-medium">{value}%</span>
			</div>
			<div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
				<div className="h-full bg-emerald-500" style={{ width }} />
			</div>
		</div>
	);
});

export function CharacterStatusCard() {
	const { t } = useI18n();
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">{t("character.title")}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3 text-sm text-zinc-300">
				<Stat label="HP" value={82} />
				<Stat label="MP" value={56} />
				<Stat label="STA" value={73} />
				<div className="flex flex-wrap gap-2 pt-1">
					<Badge className="bg-zinc-800/80">{t("character.badge.coldRes")}</Badge>
					<Badge className="bg-zinc-800/80">{t("character.badge.bleedImmune")}</Badge>
				</div>
			</CardContent>
		</Card>
	);
}


