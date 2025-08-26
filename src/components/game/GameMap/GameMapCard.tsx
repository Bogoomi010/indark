import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card";
import { Badge } from "../../ui/Badge";
import { Map as MapIcon } from "lucide-react";
import { useI18n } from "../../../i18n/i18n";
// controls는 미니맵에서 분리되어 외부에서 배치됩니다

export function GameMapCard() {
	const { t } = useI18n();
	return (
		<Card className="overflow-hidden">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<MapIcon className="w-4 h-4" />미궁 — 층 3 : 지하호수
				</CardTitle>
			</CardHeader>
			<CardContent className="p-0">
				<div className="relative w-full aspect-square">
					<div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
						{Array.from({ length: 100 }).map((_, i) => (
							<div key={i} className="border border-zinc-800/60 bg-zinc-900/60" />
						))}
					</div>
					<div className="absolute left-3 top-3 flex items-center gap-2 text-xs">
						<Badge className="rounded">{t("map.hud.coords")} (6, 4)</Badge>
						<Badge className="rounded bg-zinc-800/80">{t("map.hud.enemies")}: 2</Badge>
					</div>
					{/* Controls removed; now rendered below the center image card */}
				</div>
			</CardContent>
		</Card>
	);
}


