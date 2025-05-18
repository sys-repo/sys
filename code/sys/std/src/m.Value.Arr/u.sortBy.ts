/**
 * Return a NEW array sorted by the given key.
 *
 * @param items – source array (readonly is fine).
 * @param key   – property to sort on.
 * @param dir   – 'asc' | 'desc'  (default: 'asc').
 *
 *  •  `undefined` values are pushed to the end for 'asc'
 *     (and to the front for 'desc').
 *  •  Numbers use arithmetic compare; everything else falls
 *     back to String-compare (`localeCompare`).
 */
export const sortBy = <T, K extends keyof T>(
  items: readonly T[],
  key: K,
  dir: 'asc' | 'desc' = 'asc',
): T[] => {
  const factor = dir === 'asc' ? 1 : -1;

  const compare = (x: unknown, y: unknown): number => {
    if (x === y) return 0;
    if (x === undefined) return 1 * factor; //  undefined ⇢ after  (asc)
    if (y === undefined) return -1 * factor; // undefined ⇢ before (desc)

    if (typeof x === 'number' && typeof y === 'number') {
      return (x - y) * factor; // NB: numeric compare.
    }

    // NB: everything else → string compare.
    return String(x).localeCompare(String(y)) * factor;
  };

  // ES2023: non-mutating sort.
  return items.toSorted((a, b) => compare(a[key], b[key]));
};
