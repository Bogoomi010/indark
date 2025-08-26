export type ClassNameLike = string | undefined | false | null;

export function cx(...parts: ClassNameLike[]): string {
	return parts.filter(Boolean).join(" ");
}


