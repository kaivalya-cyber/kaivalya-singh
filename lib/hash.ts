/** Deterministic slug → short commit-style hash (e.g. #a3f9c2) */
export function slugToHash(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(6, "0").slice(0, 6);
  return `#${hex}`;
}
