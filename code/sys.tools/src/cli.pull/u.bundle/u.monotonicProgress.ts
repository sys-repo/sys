export type ProgressIn = {
  index: number;
  total: number;
};

export type ProgressOut = {
  shownIndex: number;
  total: number;
};

/**
 * Callable progress normalizer with a structural adapter.
 *
 *  - Call directly with `(index, total)`
 *  - Or via `.from({ index, total })`
 */
export type MonotonicProgress = {
  (index: number, total: number): ProgressOut;
  from(p: ProgressIn): ProgressOut;
};

/**
 * Create a progress normalizer that never moves backwards.
 *
 *  - `shownIndex` is monotonic (non-decreasing)
 *  - Resets automatically when `total` changes
 *  - Clamped to `total - 1`
 */
export function createMonotonicProgress(): MonotonicProgress {
  let maxSeen = -1;
  let lastTotal = -1;

  const update = (index: number, total: number): ProgressOut => {
    // If total changes (new run), reset.
    if (total !== lastTotal) {
      lastTotal = total;
      maxSeen = -1;
    }

    // Clamp forward only.
    if (index > maxSeen) maxSeen = index;

    // Never show beyond `total - 1`.
    const shownIndex = Math.min(maxSeen, total - 1);

    return {
      shownIndex,
      total,
    };
  };

  const fn = (index: number, total: number): ProgressOut => update(index, total);
  fn.from = (p: ProgressIn): ProgressOut => update(p.index, p.total);

  return fn;
}
