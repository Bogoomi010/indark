import React, { type HTMLAttributes, type PropsWithChildren } from "react";
import { cx } from "../../../utils/classNames";

export interface DivProps extends HTMLAttributes<HTMLDivElement> { className?: string }

export function Card({ className, children, ...props }: PropsWithChildren<DivProps>) {
	return (
		<div {...props} className={cx("bg-gray-900/80 border border-gray-800 rounded-xl p-3", className)}>
			{children}
		</div>
	);
}

export function CardHeader({ className, children }: PropsWithChildren<{ className?: string }>) {
	return <div className={cx("mb-2", className)}>{children}</div>;
}

export function CardTitle({ className, children }: PropsWithChildren<{ className?: string }>) {
	return <h3 className={cx("text-base font-semibold font-display", className)}>{children}</h3>;
}

export function CardContent({ className, children }: PropsWithChildren<{ className?: string }>) {
	return <div className={className}>{children}</div>;
}


