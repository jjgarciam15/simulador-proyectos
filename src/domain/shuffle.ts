/** Deterministic shuffle (same order for the same key) so the right answer is never always first. */
export function stableShuffle<T extends { id: string }>(key: string, list: readonly T[]): T[] {
  const h = (text: string) => {
    let x = 2166136261;
    for (const c of text) x = Math.imul(x ^ c.charCodeAt(0), 16777619);
    return x >>> 0;
  };
  return [...list].sort((a, b) => h(key + a.id) - h(key + b.id));
}
