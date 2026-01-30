import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { useState } from "react";
import { ArrowUp, ArrowRight, ArrowDown, ArrowLeft, BedDouble } from "lucide-react";
import type { Dir } from "../../../game/types";
import { useLocalGame } from "../../../game/localGame";
import { serverResolve } from "../../../game/serverActions";
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
						case 'Trap': {
							const roomKey = `${pos.x},${pos.y}`;
							const eventOn = roomEventOn[roomKey];
							// Trap 룰: 이벤트 중에는 버튼이 없다(서버에서 진입 즉시 데미지 처리)
							// eventOn이 undefined면 안전모드로 이동만 보여줌
							if (eventOn === true) return null;
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
						}
						case 'Empty': {
							const roomKey = `${pos.x},${pos.y}`;
							const eventOn = roomEventOn[roomKey];
							const canRest = eventOn === false; // 살펴보기 이후(이벤트 종료) 쉬기 노출
							return (
								<>
									{!showMove && (
										<>
											{!canRest && (
												<Button className="rounded-xl" onClick={() => void serverResolve('LOOK')}>살펴보기</Button>
											)}
											{canRest && (
												<Button className="rounded-xl" onClick={() => void serverResolve('REST')}>
													<BedDouble className="mr-2 w-4 h-4" />쉬기
												</Button>
											)}
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
						}
						case 'Monster': {
							const roomKey = `${pos.x},${pos.y}`;
							const eventOn = roomEventOn[roomKey];
							if (eventOn === undefined) {
								return <Button className="rounded-xl" onClick={() => { setShowMove(true); setGameState({ tempSceneSrc: '/img_entering.png', playerState: 'Move.Select' }); }}>이동하기</Button>;
							}
							if (eventOn === true) {
								return (
									<>
										<Button className="rounded-xl" onClick={() => void serverResolve('FIGHT')}>전투</Button>
										<Button className="rounded-xl" onClick={() => void serverResolve('FLEE')}>도망</Button>
									</>
								);
							}
							// event finished
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
													<Button key={dir} title={disabled ? '출구가 닫혀 있습니다.' : undefined} onClick={() => { setGameState({ tempSceneSrc: undefined }); move(dir); }} disabled={disabled} className="rounded-xl disabled:opacity-50">
														<Icon className="mr-2 w-4 h-4" />{label}
													</Button>
												);
											})}
											<Button className="rounded-xl" onClick={() => { setShowMove(false); setGameState({ tempSceneSrc: undefined, playerState: 'Idle' }); }}>이전</Button>
										</>
									)}
								</>
							);
						}
						case 'Treasure': {
							const roomKey = `${pos.x},${pos.y}`;
							const eventOn = roomEventOn[roomKey];
							if (eventOn === undefined) {
								return <Button className="rounded-xl" onClick={() => { setShowMove(true); setGameState({ tempSceneSrc: '/img_entering.png', playerState: 'Move.Select' }); }}>이동하기</Button>;
							}
							if (eventOn === true) {
								return <Button className="rounded-xl" onClick={() => void serverResolve('SEARCH')}>살펴보기</Button>;
							}
							// event finished -> rest(once) + move
							return (
								<>
									{!showMove && (
										<>
											<Button className="rounded-xl" onClick={() => void serverResolve('REST')}>
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
													<Button key={dir} title={disabled ? '출구가 닫혀 있습니다.' : undefined} onClick={() => { setGameState({ tempSceneSrc: undefined }); move(dir); }} disabled={disabled} className="rounded-xl disabled:opacity-50">
														<Icon className="mr-2 w-4 h-4" />{label}
													</Button>
												);
											})}
											<Button className="rounded-xl" onClick={() => { setShowMove(false); setGameState({ tempSceneSrc: undefined, playerState: 'Idle' }); }}>이전</Button>
										</>
									)}
								</>
							);
						}
						case 'Shop': {
							// TODO: 상점 UI는 추후. 지금은 이벤트 중 이동 불가 규칙만 적용.
							const roomKey = `${pos.x},${pos.y}`;
							const eventOn = roomEventOn[roomKey];
							if (eventOn === true) return null;
							// event finished or unknown -> move
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
													<Button key={dir} title={disabled ? '출구가 닫혀 있습니다.' : undefined} onClick={() => { setGameState({ tempSceneSrc: undefined }); move(dir); }} disabled={disabled} className="rounded-xl disabled:opacity-50">
														<Icon className="mr-2 w-4 h-4" />{label}
													</Button>
												);
											})}
											<Button className="rounded-xl" onClick={() => { setShowMove(false); setGameState({ tempSceneSrc: undefined, playerState: 'Idle' }); }}>이전</Button>
										</>
									)}
								</>
							);
						}
						default:
							return null;
					}
				})()}
			</div>
		</Card>
	);
}


