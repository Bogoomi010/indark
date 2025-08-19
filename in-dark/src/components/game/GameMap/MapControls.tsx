import React from "react";
import { Button } from "../../ui/Button";
import { Flame, Shield, Swords } from "lucide-react";
import { useI18n } from "../../../i18n/i18n";

export function MapControls() {
	const { t } = useI18n();
	return (
		<div className="p-3">
			<div className="flex flex-wrap gap-2">
				<Button className="rounded-xl"><Swords className="mr-2 w-4 h-4" />{t("controls.attack")}</Button>
				<Button className="rounded-xl"><Shield className="mr-2 w-4 h-4" />{t("controls.guard")}</Button>
				<Button className="rounded-xl"><Flame className="mr-2 w-4 h-4" />{t("controls.skill")}</Button>
			</div>
		</div>
	);
}


