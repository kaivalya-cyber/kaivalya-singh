/**
 * Minimal class-name joiner (shadcn's `cn` signature) with no dependencies.
 * The classes used across this project never conflict, so tailwind-merge's
 * conflict resolution isn't needed — swap it in if that changes.
 */
export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  const walk = (value: ClassValue) => {
    if (!value && value !== 0) return;
    if (typeof value === "string" || typeof value === "number") {
      out.push(String(value));
    } else if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (typeof value === "object") {
      for (const [key, on] of Object.entries(value)) if (on) out.push(key);
    }
  };
  inputs.forEach(walk);
  return out.join(" ");
}
