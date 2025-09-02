import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { ArrowUp, ArrowRight, ArrowDown, ArrowLeft, BedDouble } from "lucide-react";
import { useI18n } from "../../../i18n/i18n";
import type { Dir } from "../../../game/types";
import { useLocalGame } from "../../../game/localGame";
import { roomTypeFor } from "../../../game/room";
import { ROOM_ACTIONS } from "../../../game/room-actions";

const arrows: Array<{ dir: Dir; label: string; Icon: typeof ArrowUp }> = [
	{ dir: 'N', label: '북', Icon: ArrowUp },
	{ dir: 'E', label: '동', Icon: ArrowRight },
	{ dir: 'S', label: '남', Icon: ArrowDown },
	{ dir: 'W', label: '서', Icon: ArrowLeft },
];

export function PlayerActionControls() {
	const { t } = useI18n();
	const { exits, move, pos, worldSeed } = useLocalGame();
	const roomType = roomTypeFor(pos.x, pos.y, worldSeed);
	const actions = ROOM_ACTIONS[roomType];

	return (
		<Card className="mt-3">
			<div className="flex flex-wrap justify-between items-start gap-2">
				<div className="flex flex-wrap justify-center gap-2">
					{arrows.map(({ dir, label, Icon }) => {
						const disabled = !exits[dir];
						return (
							<Button
								key={dir}
								title={disabled ? '출구가 닫혀 있습니다.' : undefined}
								onClick={() => move(dir)}
								disabled={disabled}
								className="rounded-xl disabled:opacity-50"
							>
								<Icon className="mr-2 w-4 h-4" />{label}
							</Button>
						);
					})}
				</div>
				<div className="mt-0 flex items-start gap-2">
					<Button onClick={() => alert('준비중')} className="rounded-xl">
						<BedDouble className="mr-2 w-4 h-4" />{t("controls.rest")}
					</Button>
				</div>
			</div>
			{actions?.length > 0 && (
				<div className="mt-3 flex flex-wrap justify-center gap-2">
					{actions.map((a, idx) => (
						<Button key={`${a.label}-${idx}`} className="rounded-xl">
							{a.label}
						</Button>
					))}
				</div>
			)}
		</Card>
	);
}


