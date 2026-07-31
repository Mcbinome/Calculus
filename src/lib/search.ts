/** Normalise pour recherche souple : sans accents, minuscules. */
export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function matchesSearch(haystack: string, query: string): boolean {
  const q = normalizeSearch(query)
  if (!q) return true
  return normalizeSearch(haystack).includes(q)
}
