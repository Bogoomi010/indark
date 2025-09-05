import { Card } from "../../ui/Card";
import { cx } from "../../../utils/classNames";
import { useEffect, useRef, useState } from "react";
import { useLocalGame } from "../../../game/localGame";
import { useGameStore } from "../../../game/state";
import { monsterKindFor } from "../../../game/room";

// 단일 프리셋(하위 호환): 특정 키에 대해 고정 이미지
const IMAGE_PRESETS: Record<string, { src: string; alt: string }> = {
	// 기본 프리셋: 필요 시 이곳에 시나리오별 이미지를 추가하세요
	dungeonEntrance: {
		src: "/dungeon-entrance.png",
		alt: "어두운 미궁 입구를 밝히는 횃불",
	},
	roomEmpty: { src: "/img_explore.png", alt: "텅 빈 방" },
	roomMonster: { src: "/img_combat01.png", alt: "괴물이 있는 방" },
	roomTrap: { src: "/img_room_trap.png", alt: "함정이 있는 방" },
	roomShop: { src: "/img_game_start.png", alt: "상점 방" },
	roomTreasure: { src: "/img_get_rat.png", alt: "보물 방" },
};

// 방 타입별 다중 이미지(몬스터/트랩/보물 등 서브타입): 배열에서 결정적으로 하나 선택
const IMAGE_VARIANTS: Record<string, Array<{ src: string; alt: string }>> = {
	roomMonster: [
		{ src: "/img_combat_skeleton.png", alt: "몬스터: 유형 A" },
		{ src: "/img_combat_devil.png", alt: "몬스터: 유형 B" },
		{ src: "/img_combat_spider.png", alt: "몬스터: 유형 C" },
	],
	roomTrap: [
		{ src: "/img_room_trap.png", alt: "함정: 유형 A" },
	],
	roomTreasure: [
		{ src: "/img_get_rat.png", alt: "보물: 유형 A" },
		{ src: "/img_get_food01.png", alt: "보물: 유형 B" },
		{ src: "/img_get_rat_alive.png", alt: "보물: 유형 C" },
	],
};

function hashString(input: string): number {
	let h = 2166136261 >>> 0;
	for (let i = 0; i < input.length; i++) {
		h ^= input.charCodeAt(i);
		h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
	}
	return h >>> 0;
}

export interface SceneImageSectionProps {
	/** 사전에 정의된 프리셋 키 (예: "dungeonEntrance") */
	variant?: keyof typeof IMAGE_PRESETS | string;
	/** 커스텀 이미지 경로 (variant보다 우선) */
	src?: string;
	/** 대체 텍스트 (src 또는 variant에 대한 기본값을 덮어씀) */
	alt?: string;
	/** 카드 컨테이너에 추가할 클래스 */
	className?: string;
	/** 이미지 태그에 추가할 클래스 */
	imageClassName?: string;
	/** 외부 상태 변화에 맞춰 전환을 강제 트리거하기 위한 키 */
	changeKey?: string | number;
}

export function SceneImageSection({ variant, src, alt, className, imageClassName, changeKey }: SceneImageSectionProps) {
	// variant가 IMAGE_VARIANTS에 존재하면 changeKey를 씨드로 결정적으로 선택
	const vKey = variant ? String(variant) : undefined;
	let resolved: { src: string; alt: string } | undefined = undefined;

	// 특수 규칙: roomEmpty는 TORCH 게이지에 따라 이미지 분기
	const { torch, pos, worldSeed } = useLocalGame();
	const playerState = useGameStore(s => s.playerState);

	// 최우선 규칙: 플레이어 상태가 시작/재시작이면 1회 우선 표시 (좌표 무관)
	if (!resolved) {
		if (playerState === 'Game.Start') {
			resolved = { src: "/img_game_start.png", alt: "게임 시작" };
		} else if (playerState === 'Game.Restart') {
			// 재시작 이미지는 별도 리소스가 없으므로 시작 이미지로 통일
			resolved = { src: "/img_game_restart.png", alt: "게임 재시작" };
		}
	}
	if (!resolved && vKey === 'roomEmpty') {
		resolved = {
			src: "/img_explore.png",
			alt: torch > 0 ? "텅 빈 방" : "횃불이 꺼진 텅 빈 방",
		};
	}

	if (!resolved && vKey && IMAGE_VARIANTS[vKey]?.length) {
		// 몬스터 방은 좌표/시드 기반 결정적 서브타입을 사용해 인덱스 고정
		if (vKey === 'roomMonster') {
			const kind = monsterKindFor(pos.x, pos.y, worldSeed);
			const map: Record<string, number> = { skeleton: 0, devil: 1, spider: 2 };
			const idx = map[kind] ?? 0;
			resolved = IMAGE_VARIANTS[vKey][idx];
		} else {
		const arr = IMAGE_VARIANTS[vKey];
		const seed = `${vKey}:${String(changeKey ?? "")}`;
		const idx = arr.length > 0 ? hashString(seed) % arr.length : 0;
		resolved = arr[idx];
		}
	}

	// 다중 이미지가 아니면 단일 프리셋으로 처리
	const preset = !resolved && vKey ? IMAGE_PRESETS[vKey] : undefined;

	const finalSrc = src ?? resolved?.src ?? preset?.src ?? "";
	const finalAlt = alt ?? resolved?.alt ?? preset?.alt ?? "";

	const [visibleSrc, setVisibleSrc] = useState(finalSrc);
	const [fade, setFade] = useState<'in' | 'out'>('in');
	const pendingSrc = useRef<string>(finalSrc);

	useEffect(() => {
		if (!finalSrc) return;
		// 새로운 이미지로 전환: 먼저 페이드아웃 후 교체, 다시 페이드인
		if (finalSrc !== pendingSrc.current) {
			pendingSrc.current = finalSrc;
			setFade('out');
			const id = setTimeout(() => {
				setVisibleSrc(finalSrc);
				setFade('in');
			}, 150);
			return () => clearTimeout(id);
		}
	}, [finalSrc]);

	// 외부 강제 트리거: changeKey가 바뀌면 동일한 이미지라도 페이드 재생
	useEffect(() => {
		if (!visibleSrc) return;
		setFade('out');
		const id = setTimeout(() => setFade('in'), 150);
		return () => clearTimeout(id);
	}, [changeKey]);

	if (!visibleSrc) return null;

	return (
		<Card className={cx("overflow-hidden h-full", className)}>
			{/* 부모(카드) 높이에 맞춰 이미지를 맞춤. 잘림 없이 보이도록 contain 사용 */}
			<div className="relative w-full h-full">
				<img
					src={visibleSrc}
					alt={finalAlt}
					className={cx(
						"absolute inset-0 w-full h-full object-contain object-center transition-opacity duration-200",
						fade === 'in' ? 'opacity-100' : 'opacity-0',
						imageClassName,
					)}
				/>
			</div>
		</Card>
	);
}


