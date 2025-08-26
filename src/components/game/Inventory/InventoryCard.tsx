import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card";
import { Backpack, Shield, Swords } from "lucide-react";
import { useI18n } from "../../../i18n/i18n";

export function InventoryCard() {
	const { t } = useI18n();
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<Backpack className="w-4 h-4" />{t("inventory.title")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-5 gap-2">
					{Array.from({ length: 20 }).map((_, i) => (
						<div key={i} className="aspect-square rounded-lg bg-zinc-800 grid place-items-center text-zinc-400">
							{i === 2 ? <Swords className="w-5 h-5" /> : i === 6 ? <Shield className="w-5 h-5" /> : <Backpack className="w-5 h-5" />}
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}


