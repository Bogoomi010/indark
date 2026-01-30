import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card";
import { Backpack, Shield, Swords, Coins, Utensils } from "lucide-react";
import { useI18n } from "../../../i18n/i18n";
import { useGameStore } from "../../../game/state";
import { getItemDef } from "../../../game/items";
import { serverUseItem } from "../../../game/serverActions";

function iconFor(itemId: string) {
	if (itemId.startsWith('weapon_')) return Swords;
	if (itemId.startsWith('armor_')) return Shield;
	if (itemId.startsWith('food_')) return Utensils;
	return Backpack;
}

export function InventoryCard() {
	const { t } = useI18n();
	const inventory = useGameStore(s => s.inventory);
	const gold = useGameStore(s => s.gold);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<Backpack className="w-4 h-4" />{t("inventory.title")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-5 gap-2">
					{inventory.map((slot) => {
						const hasItem = Boolean(slot.itemId);
						const def = slot.itemId ? getItemDef(slot.itemId) : null;
						const Icon = slot.itemId ? iconFor(slot.itemId) : Backpack;
						return (
							<button
								key={slot.slot}
								type="button"
								className="relative aspect-square rounded-lg bg-zinc-800 grid place-items-center text-zinc-200 disabled:opacity-60"
								title={def ? `${def.name} x${slot.qty}` : '빈 슬롯'}
								disabled={!hasItem}
								onClick={() => {
									if (!def || !slot.itemId) return;
									if (def.kind !== 'consumable') return;
									const ok = window.confirm(`사용하겠습니까?\n${def.name} x${slot.qty}`);
									if (!ok) return;
									void serverUseItem(slot.slot);
								}}
							>
								<Icon className="w-5 h-5" />
								{hasItem && slot.qty > 1 && (
									<span className="absolute bottom-1 right-1 text-[10px] px-1 rounded bg-black/60">{slot.qty}</span>
								)}
							</button>
						);
					})}
				</div>

				<div className="mt-3 flex items-center justify-start gap-2 text-sm text-zinc-200">
					<Coins className="w-4 h-4" />
					<span>GOLD: {gold}</span>
				</div>
			</CardContent>
		</Card>
	);
}


