import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card";
import { Avatar, AvatarFallback } from "../../ui/Avatar";
import { Search, Users2 } from "lucide-react";
import { useI18n } from "../../../i18n/i18n";

const FeedItem = memo(function FeedItem({ user, text }: { user: string; text: string }) {
	return (
		<div className="flex gap-3 py-1.5">
			<Avatar className="shrink-0">
				<AvatarFallback>{user.slice(0, 2)}</AvatarFallback>
			</Avatar>
			<div className="flex-1">
				<p className="text-sm">
					<span className="font-medium mr-2">{user}</span>
					{text}
				</p>
				<div className="mt-2 h-px bg-zinc-800" />
			</div>
		</div>
	);
});

export function CommunityCard() {
	const { t } = useI18n();
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<Users2 className="w-4 h-4" />{t("community.title")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="relative">
					<input placeholder={t("community.search")} className="w-full pr-10 px-2 py-1.5 rounded bg-gray-800 text-sm" />
					<Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
				</div>
				<div className="h-48 mt-3 pr-1 overflow-y-auto space-y-2">
					<FeedItem user="Rhea" text="층 3 보스는 냉기 피해가 잘 먹힘" />
					<FeedItem user="Dane" text="희귀 반지 드랍 위치? 동쪽 방 2개 지나서" />
					<FeedItem user="Ludus" text="UI 다크 테마 너무 좋다 ✨" />
					<FeedItem user="Kane" text="오늘 저녁 9시 레이드 모집" />
				</div>
			</CardContent>
		</Card>
	);
}


