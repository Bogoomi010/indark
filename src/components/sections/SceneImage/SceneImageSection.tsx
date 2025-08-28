import { Card } from "../../ui/Card";
import { cx } from "../../../utils/classNames";

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
}

export function SceneImageSection({ variant, src, alt, className, imageClassName }: SceneImageSectionProps) {
	const preset = variant ? IMAGE_PRESETS[String(variant)] : undefined;
	const finalSrc = src ?? preset?.src ?? "";
	const finalAlt = alt ?? preset?.alt ?? "";

	if (!finalSrc) return null;

	return (
		<Card className={cx("overflow-hidden h-full", className)}>
			{/* 부모(카드) 높이에 맞춰 이미지를 맞춤. 잘림 없이 보이도록 contain 사용 */}
			<div className="relative w-full h-full">
				<img
					src={finalSrc}
					alt={finalAlt}
					className={cx("absolute inset-0 w-full h-full object-contain object-center", imageClassName)}
				/>
			</div>
		</Card>
	);
}


