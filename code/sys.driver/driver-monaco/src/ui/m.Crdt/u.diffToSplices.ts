import { type t } from './common.ts';

/**
 * Given naive code-unit prefix/suffix lengths, clamp to safe boundaries
 * and compute a single splice.
 */
export function diffToSplices(before: string, after: string): t.Crdt.Splice[] {
  if (typeof before !== 'string' || typeof after !== 'string') {
    const tb = typeof before;
    const ta = typeof after;
    throw new TypeError(`diffToSplices: non-string input (before:${tb}, after:${ta})`);
  }

  if (before === after) return [] as t.Crdt.Splice[];

  // naive code-unit LCP/LCS
  let prefix = 0;
  const minLen = Math.min(before.length, after.length);
  while (prefix < minLen && before.charCodeAt(prefix) === after.charCodeAt(prefix)) prefix++;

  let suffix = 0;
  while (
    suffix < minLen - prefix &&
    before.charCodeAt(before.length - 1 - suffix) === after.charCodeAt(after.length - 1 - suffix)
  ) {
    suffix++;
  }

  // clamp bounds to avoid splitting surrogate pairs
  let startCU = clampStartToPair(before, prefix);
  let endBeforeCU = clampEndToPair(before, before.length - suffix);
  let endAfterCU = clampEndToPair(after, after.length - suffix);

  // recompute suffix if clamping changed alignment
  if (endBeforeCU < startCU) endBeforeCU = startCU;
  if (endAfterCU < startCU) endAfterCU = startCU;

  const delCount = endBeforeCU - startCU;
  const insertText = after.slice(startCU, endAfterCU);
  return [{ index: startCU, delCount, insertText }] as const;
}

/**
 * Helpers:
 */
const isHigh = (u: number) => u >= 0xd800 && u <= 0xdbff;
const isLow = (u: number) => u >= 0xdc00 && u <= 0xdfff;

/** If start falls on a low-surrogate, back up one to the high-surrogate. */
function clampStartToPair(s: string, i: number) {
  if (i <= 0) return 0;
  const cur = s.charCodeAt(i);
  const prev = s.charCodeAt(i - 1);
  return isLow(cur) && isHigh(prev) ? i - 1 : i;
}

/** If end (exclusive) ends after a high-surrogate, advance one to include the low-surrogate. */
function clampEndToPair(s: string, i: number) {
  if (i <= 0) return 0;
  if (i >= s.length) return s.length;
  const prev = s.charCodeAt(i - 1);
  const cur = s.charCodeAt(i);
  return isHigh(prev) && isLow(cur) ? i + 1 : i;
}
