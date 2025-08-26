import { Button } from "../../ui/Button";
import { Separator } from "../../ui/Separator";
import { Sparkles } from "lucide-react";
import { useI18n } from "../../../i18n/i18n";

export function Hero() {
	const { t } = useI18n();
	return (
		<section id="home" className="px-4 sm:px-6 lg:px-8 py-6">
			<div className="mx-auto max-w-7xl">
				<h1 className="text-3xl sm:text-4xl font-extrabold leading-tight font-display">{t("hero.title")}</h1>
				<p className="mt-2 text-zinc-300 max-w-2xl">{t("hero.subtitle")}</p>
				<div className="mt-4 flex gap-2">
					<Button className="rounded-2xl">{t("hero.cta.start")}</Button>
					<Button className="rounded-2xl bg-zinc-800 hover:bg-zinc-700">
						<Sparkles className="mr-2 w-4 h-4" />{t("hero.cta.patch")}
					</Button>
				</div>
			</div>
			<Separator className="mt-6" />
		</section>
	);
}


