import type { Seen, SeenMark } from './t.kernel.ts';

/**
 * Maintain the bijective left↔right object mapping for cyclic/shared graphs.
 */
export function markSeen(
  a: object,
  b: object,
  seen: Seen,
  trail?: SeenMark[],
): boolean | undefined {
  const mappedRight = seen.left.get(a);
  if (mappedRight !== undefined) return mappedRight === b;

  const mappedLeft = seen.right.get(b);
  if (mappedLeft !== undefined) return mappedLeft === a;

  seen.left.set(a, b);
  seen.right.set(b, a);
  trail?.push({ left: a, right: b });
  return undefined;
}

/**
 * Roll back speculative graph matches after failed Map/Set backtracking branches.
 */
export function rollback(trail: readonly SeenMark[], seen: Seen) {
  for (const mark of [...trail].reverse()) {
    seen.left.delete(mark.left);
    seen.right.delete(mark.right);
  }
}
