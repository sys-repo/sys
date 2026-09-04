import { rollback } from './u.kernel.graph.ts';
import { MAP_ENTRIES, MAP_SIZE_GET, SET_SIZE_GET, SET_VALUES } from './u.kernel.intrinsics.ts';
import type { DeepEquals, Seen, SeenMark } from './t.kernel.ts';

/**
 * Order-independent Map/Set comparison.
 *
 * Matching is backtracking, not greedy, because structurally equal candidates
 * may differ only by later graph-topology constraints.
 */
export function equalMaps(
  a: Map<unknown, unknown>,
  b: Map<unknown, unknown>,
  seen: Seen,
  deepEquals: DeepEquals,
  trail?: SeenMark[],
) {
  if (MAP_SIZE_GET.call(a) !== MAP_SIZE_GET.call(b)) return false;
  return matchMapEntries(
    Array.from(MAP_ENTRIES.call(a)),
    Array.from(MAP_ENTRIES.call(b)),
    seen,
    deepEquals,
    trail,
  );
}

export function equalSets(
  a: Set<unknown>,
  b: Set<unknown>,
  seen: Seen,
  deepEquals: DeepEquals,
  trail?: SeenMark[],
) {
  if (SET_SIZE_GET.call(a) !== SET_SIZE_GET.call(b)) return false;
  return matchSetValues(
    Array.from(SET_VALUES.call(a)),
    Array.from(SET_VALUES.call(b)),
    seen,
    deepEquals,
    trail,
  );
}

function matchMapEntries(
  aEntries: readonly (readonly [unknown, unknown])[],
  bEntries: readonly (readonly [unknown, unknown])[],
  seen: Seen,
  deepEquals: DeepEquals,
  parentTrail?: SeenMark[],
): boolean {
  if (aEntries.length === 0) return true;
  const [aEntry, ...restA] = aEntries;

  for (const [candidateIndex, bEntry] of bEntries.entries()) {
    const branchTrail: SeenMark[] = [];
    const keysMatch = deepEquals(aEntry[0], bEntry[0], seen, branchTrail);
    const valuesMatch = keysMatch && deepEquals(aEntry[1], bEntry[1], seen, branchTrail);

    if (valuesMatch) {
      const restB = bEntries.filter((_, index) => index !== candidateIndex);
      if (matchMapEntries(restA, restB, seen, deepEquals, branchTrail)) {
        parentTrail?.push(...branchTrail);
        return true;
      }
    }

    rollback(branchTrail, seen);
  }

  return false;
}

function matchSetValues(
  aValues: readonly unknown[],
  bValues: readonly unknown[],
  seen: Seen,
  deepEquals: DeepEquals,
  parentTrail?: SeenMark[],
): boolean {
  if (aValues.length === 0) return true;
  const [aValue, ...restA] = aValues;

  for (const [candidateIndex, bValue] of bValues.entries()) {
    const branchTrail: SeenMark[] = [];

    if (deepEquals(aValue, bValue, seen, branchTrail)) {
      const restB = bValues.filter((_, index) => index !== candidateIndex);
      if (matchSetValues(restA, restB, seen, deepEquals, branchTrail)) {
        parentTrail?.push(...branchTrail);
        return true;
      }
    }

    rollback(branchTrail, seen);
  }

  return false;
}
