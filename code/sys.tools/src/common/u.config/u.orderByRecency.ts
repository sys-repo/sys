import { type t } from './common.ts';


/**
 * Returns a new list ordered by:
 *   1. Most recent `lastUsedAt` (descending)
 *   2. For items without `lastUsedAt`: most recent `createdAt` (descending)
 *   Items missing both timestamps are placed last.
 */
export function orderByRecency<T extends Recency>(items: T[] = []) {
  return [...items].sort((a, b) => {
    const A = a.lastUsedAt;
    const B = b.lastUsedAt;

    // Primary: lastUsedAt if either has one.
    if (A != null || B != null) {
      const LA = A ?? 0;
      const LB = B ?? 0;
      if (LA !== LB) return LB - LA; // descending
    }

    // Secondary: createdAt
    const CA = a.createdAt ?? 0;
    const CB = b.createdAt ?? 0;
    return CB - CA; // descending
  });
}
