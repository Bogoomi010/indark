import React, { useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { MessageSquare } from "lucide-react";
import { useI18n } from "../../../i18n/i18n";

export interface ChatCardProps { log: string[]; onSend: (msg: string) => void }

export function ChatCard({ log, onSend }: ChatCardProps) {
	const { t } = useI18n();
	const [chatInput, setChatInput] = useState("");

	const handleEnter = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				e.preventDefault();
				const text = chatInput.trim();
				if (!text) return;
				onSend(text);
				setChatInput("");
			}
		},
		[chatInput, onSend]
	);

	const handleClick = useCallback(() => {
		const text = chatInput.trim();
		if (!text) return;
		onSend(text);
		setChatInput("");
	}, [chatInput, onSend]);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">{t("chat.title")}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="h-40 overflow-y-auto text-sm mb-2 space-y-1">
					{log.map((line, idx) => (
						<div key={idx}>{line}</div>
					))}
				</div>
				<div className="flex gap-2">
					<input
						value={chatInput}
						onChange={(e) => setChatInput(e.target.value)}
						onKeyDown={handleEnter}
						placeholder={t("chat.placeholder")}
						className="flex-1 px-2 py-1.5 rounded bg-gray-800 text-white"
					/>
					<Button onClick={handleClick}>
						<MessageSquare className="mr-1.5 w-4 h-4" />{t("chat.send")}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}


