import { Card } from "../../ui/Card";
import { cx } from "../../../utils/classNames";
import { useEffect, useRef, useState } from "react";

const IMAGE_PRESETS: Record<string, { src: string; alt: string }> = {
	// 기본 프리셋: 필요 시 이곳에 시나리오별 이미지를 추가하세요
	dungeonEntrance: {
		src: "/dungeon-entrance.png",
		alt: "어두운 미궁 입구를 밝히는 횃불",
	},
};

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
	const preset = variant ? IMAGE_PRESETS[String(variant)] : undefined;
	const finalSrc = src ?? preset?.src ?? "";
	const finalAlt = alt ?? preset?.alt ?? "";

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


