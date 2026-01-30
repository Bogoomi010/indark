import seedrandom from "seedrandom";
import crypto from "crypto";

export function randomSeedString(bytes = 16): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function hashToSeed(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function rngFromSeed(seed: string): () => number {
  const rng = seedrandom(seed);
  return () => rng();
}

export function pickOne<T>(rng: () => number, items: T[]): T {
  if (items.length === 0) throw new Error("pickOne: empty array");
  const idx = Math.floor(rng() * items.length);
  return items[Math.min(idx, items.length - 1)];
}

export function pickUnique<T>(rng: () => number, items: T[], count: number): T[] {
  if (count <= 0) return [];
  if (count >= items.length) return [...items];
  const copy = [...items];
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

export function chance(rng: () => number, p: number): boolean {
  return rng() < p;
}
