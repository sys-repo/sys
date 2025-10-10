type Splice = { index: number; delCount: number; insertText: string };

/**
 * Minimal single-diff algorithm (O(n)).
 *
 * Returns an array of { index, delCount, insertText } suitable for
 *    • Automerge.splice(...)
 *    • Monaco pushEditOperations(...)
 *
 * For typical typing it yields exactly one splice.
 */
export function diffToSplices(before: string, after: string): Splice[] {
  if (typeof before !== 'string' || typeof after !== 'string') {
    const tb = typeof before;
    const ta = typeof after;
    throw new TypeError(`diffToSplices: non-string input (before:${tb}, after:${ta})`);
  }

  if (before === after) return [];

  // Find common prefix:
  let start = 0;
  for (
    const len = Math.min(before.length, after.length);
    start < len && before[start] === after[start];
    start++
  ) {
    /* walk */
  }

  // Find common suffix:
  let endBefore = before.length - 1;
  let endAfter = after.length - 1;
  while (endBefore >= start && endAfter >= start && before[endBefore] === after[endAfter]) {
    endBefore--;
    endAfter--;
  }

  const delCount = endBefore - start + 1; // May be 0 (pure insert).
  const insertText = after.slice(start, endAfter + 1);

  return [{ index: start, delCount, insertText }];
}
