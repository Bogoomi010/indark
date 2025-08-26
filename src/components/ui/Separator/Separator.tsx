import { cx } from "../../../utils/classNames";

export function Separator({ className }: { className?: string }) {
	return <hr className={cx("border-gray-800", className)} />;
}


