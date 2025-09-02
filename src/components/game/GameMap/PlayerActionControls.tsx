import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { ArrowUp, ArrowRight, ArrowDown, ArrowLeft, BedDouble } from "lucide-react";
import type { Dir } from "../../../game/types";
import { useLocalGame } from "../../../game/localGame";
import { roomTypeFor } from "../../../game/room";

const arrows: Array<{ dir: Dir; label: string; Icon: typeof ArrowUp }> = [
	{ dir: 'N', label: '북', Icon: ArrowUp },
	{ dir: 'E', label: '동', Icon: ArrowRight },
	{ dir: 'S', label: '남', Icon: ArrowDown },
	{ dir: 'W', label: '서', Icon: ArrowLeft },
];

export function PlayerActionControls() {
	const { exits, move, pos, worldSeed } = useLocalGame();
	const roomType = roomTypeFor(pos.x, pos.y, worldSeed);

	return (
		<Card className="mt-3">
			<div className="flex flex-wrap justify-center gap-2">
				{roomType === 'Trap' && (
					<>
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
					</>
				)}

				{roomType === 'Empty' && (
					<>
						<Button className="rounded-xl" onClick={() => alert('살펴보기: 준비중')}>살펴보기</Button>
						<Button className="rounded-xl" onClick={() => alert('쉬기: 준비중')}>
							<BedDouble className="mr-2 w-4 h-4" />쉬기
						</Button>
					</>
				)}

				{roomType === 'Monster' && (
					<>
						<Button className="rounded-xl" onClick={() => alert('전투: 준비중')}>전투</Button>
						<Button className="rounded-xl" onClick={() => alert('도망: 준비중')}>도망</Button>
					</>
				)}

				{roomType === 'Treasure' && (
					<Button className="rounded-xl" onClick={() => alert('살펴보기: 준비중')}>살펴보기</Button>
				)}
			</div>
		</Card>
	);
}


