import React, { type ButtonHTMLAttributes, type PropsWithChildren } from "react";
import { cx } from "../../../utils/classNames";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	className?: string;
}

export function Button({ className, children, ...props }: PropsWithChildren<ButtonProps>) {
	return (
		<button
			{...props}
			className={cx("inline-flex items-center justify-center px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded transition font-display text-sm leading-none whitespace-nowrap", className)}
		>
			{children}
		</button>
	);
}


