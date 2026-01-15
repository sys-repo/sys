type BestMatch = {
  readonly name: string;
  readonly distance: number;
  readonly similarity: number; // 0..1 (1 = identical)
};

/**
 * Returns the best (closest) filename + distance/similarity,
 * or undefined if the list is empty.
 */
export function findClosestFilename(
  target: string,
  filenames: readonly string[],
): BestMatch | undefined {
  if (!filenames.length) return undefined;

  let best: BestMatch | undefined;

  for (const name of filenames) {
    const distance = levenshteinDistance(target, name);
    const maxLen = Math.max(target.length, name.length) || 1;
    const similarity = 1 - distance / maxLen;

    if (!best || similarity > best.similarity) {
      best = { name, distance, similarity };
    }
  }

  return best;
}

/**
 * Returns the top N closest filenames above an optional similarity threshold.
 */
export function findTopFilenames(
  target: string,
  filenames: readonly string[],
  options: { readonly limit?: number; readonly minSimilarity?: number } = {},
): readonly BestMatch[] {
  const { limit = 5, minSimilarity = 0.0 } = options;

  const scored: BestMatch[] = filenames.map((name) => {
    const distance = levenshteinDistance(target, name);
    const maxLen = Math.max(target.length, name.length) || 1;
    const similarity = 1 - distance / maxLen;
    return { name, distance, similarity };
  });

  return scored
    .filter((item) => item.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Classic Levenshtein distance, iterative, O(m·n), 2-row buffer.
 */
function levenshteinDistance(a: string, b: string): number {
  const lenA = a.length;
  const lenB = b.length;

  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;
  if (a === b) return 0;

  // Ensure `a` is the shorter string to keep the buffer small.
  if (lenA > lenB) return levenshteinDistance(b, a);

  let previous = new Array(lenA + 1);
  let current = new Array(lenA + 1);

  for (let i = 0; i <= lenA; i += 1) {
    previous[i] = i;
  }

  for (let j = 1; j <= lenB; j += 1) {
    current[0] = j;
    const bj = b.charCodeAt(j - 1);

    for (let i = 1; i <= lenA; i += 1) {
      const cost = a.charCodeAt(i - 1) === bj ? 0 : 1;

      const deletion = previous[i] + 1;
      const insertion = current[i - 1] + 1;
      const substitution = previous[i - 1] + cost;

      let value = deletion;
      if (insertion < value) value = insertion;
      if (substitution < value) value = substitution;

      current[i] = value;
    }

    const temp = previous;
    previous = current;
    current = temp;
  }

  return previous[lenA];
}
