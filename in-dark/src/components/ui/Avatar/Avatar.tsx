import React, { type PropsWithChildren } from "react";
import { cx } from "../../../utils/classNames";

export function Avatar({ className, children }: PropsWithChildren<{ className?: string }>) {
	return (
		<div className={cx("w-8 h-8 rounded-full bg-gray-600 overflow-hidden flex items-center justify-center text-white", className)}>
			{children}
		</div>
	);
}

export function AvatarFallback({ className, children }: PropsWithChildren<{ className?: string }>) {
	return <span className={cx("text-xs font-medium", className)}>{children}</span>;
}


