import { type PropsWithChildren } from "react";
import { cx } from "../../../utils/classNames";

export function Badge({ className, children }: PropsWithChildren<{ className?: string }>) {
	return (
		<span className={cx("inline-flex items-center px-2 py-0.5 text-xs rounded bg-gray-700 text-gray-100", className)}>
			{children}
		</span>
	);
}


