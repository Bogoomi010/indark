import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { useState } from "react";
import { ArrowUp, ArrowRight, ArrowDown, ArrowLeft, BedDouble } from "lucide-react";
import type { Dir } from "../../../game/types";
import { useLocalGame } from "../../../game/localGame";
import { effectiveRoomTypeFor } from "../../../game/room";
import { useGameStore } from "../../../game/state";

const arrows: Array<{ dir: Dir; label: string; Icon: typeof ArrowUp }> = [
	{ dir: 'N', label: '북', Icon: ArrowUp },
	{ dir: 'E', label: '동', Icon: ArrowRight },
	{ dir: 'S', label: '남', Icon: ArrowDown },
	{ dir: 'W', label: '서', Icon: ArrowLeft },
];

export function PlayerActionControls() {
	const { exits, move, pos, worldSeed } = useLocalGame();
	const [showMove, setShowMove] = useState(false);
	const roomEventOn = useGameStore(s => s.roomEventOn);
	const roomType = effectiveRoomTypeFor(pos.x, pos.y, worldSeed, roomEventOn[`${pos.x},${pos.y}`]);
	const playerState = useGameStore(s => s.playerState);
	const setGameState = useGameStore(s => s.setState);
	const isStart = playerState === 'Game.Start' || playerState === 'Game.Restart';

	return (
		<Card className="mt-3">
			<div className="flex flex-wrap justify-center gap-2">
				{/* 게임 시작/재시작 상태: 방 타입 무시, 이동하기 -> 방향 버튼 노출, 출구 무시 */}
				{isStart && (
					<>
						{!showMove && (
							<Button className="rounded-xl" onClick={() => { setShowMove(true); setGameState({ tempSceneSrc: '/img_entering.png', playerState: 'Move.Select' }); }}>이동하기</Button>
						)}
						{showMove && (
							<>
								{arrows.map(({ dir, label, Icon }) => (
									<Button
										key={dir}
										onClick={() => { setGameState({ playerState: 'Idle', tempSceneSrc: undefined }); move(dir); }}
										className="rounded-xl"
									>
										<Icon className="mr-2 w-4 h-4" />{label}
									</Button>
								))}
								<Button className="rounded-xl" onClick={() => { setShowMove(false); setGameState({ tempSceneSrc: undefined, playerState: 'Idle' }); }}>이전</Button>
							</>
						)}
					</>
				)}

				{!isStart && (() => {
				{/* 방 타입별로 하나의 버튼 세트만 렌더 */}
					switch (roomType) {
						case 'Trap':
							return (
								<>
									{!showMove && (
										<Button className="rounded-xl" onClick={() => { setShowMove(true); setGameState({ tempSceneSrc: '/img_entering.png', playerState: 'Move.Select' }); }}>이동하기</Button>
									)}
									{showMove && (
										<>
											{arrows.map(({ dir, label, Icon }) => {
												const disabled = !exits[dir];
												return (
													<Button
														key={dir}
														title={disabled ? '출구가 닫혀 있습니다.' : undefined}
														onClick={() => { setGameState({ tempSceneSrc: undefined }); move(dir); }}
														disabled={disabled}
														className="rounded-xl disabled:opacity-50"
													>
														<Icon className="mr-2 w-4 h-4" />{label}
													</Button>
												);
											})}
											<Button className="rounded-xl" onClick={() => { setShowMove(false); setGameState({ tempSceneSrc: undefined, playerState: 'Idle' }); }}>이전</Button>
										</>
									)}
								</>
							);
						case 'Empty':
							return (
								<>
									{!showMove && (
										<>
											<Button className="rounded-xl" onClick={() => alert('살펴보기: 준비중')}>살펴보기</Button>
											<Button className="rounded-xl" onClick={() => alert('쉬기: 준비중')}>
												<BedDouble className="mr-2 w-4 h-4" />쉬기
											</Button>
											<Button className="rounded-xl" onClick={() => { setShowMove(true); setGameState({ tempSceneSrc: '/img_entering.png', playerState: 'Move.Select' }); }}>이동하기</Button>
										</>
									)}
									{showMove && (
										<>
											{arrows.map(({ dir, label, Icon }) => {
												const disabled = !exits[dir];
												return (
													<Button
														key={dir}
														title={disabled ? '출구가 닫혀 있습니다.' : undefined}
														onClick={() => { setGameState({ tempSceneSrc: undefined }); move(dir); }}
														disabled={disabled}
														className="rounded-xl disabled:opacity-50"
													>
														<Icon className="mr-2 w-4 h-4" />{label}
													</Button>
												);
											})}
											<Button className="rounded-xl" onClick={() => { setShowMove(false); setGameState({ tempSceneSrc: undefined, playerState: 'Idle' }); }}>이전</Button>
										</>
									)}
								</>
							);
						case 'Monster':
							return (
								<>
									<Button className="rounded-xl" onClick={() => alert('전투: 준비중')}>전투</Button>
									<Button className="rounded-xl" onClick={() => alert('도망: 준비중')}>도망</Button>
								</>
							);
						case 'Treasure':
							return <Button className="rounded-xl" onClick={() => alert('살펴보기: 준비중')}>살펴보기</Button>;
						case 'Shop':
							return null; // 현재 상점 전용 버튼 없음
						default:
							return null;
					}
				})()}
			</div>
		</Card>
	);
}


