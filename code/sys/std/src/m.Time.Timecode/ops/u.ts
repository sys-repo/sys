import { type t } from '../common.ts';
import { toEntries } from '../core/u.toEntries.ts';

/**
 * Return the first entry matching a predicate.
 * Mirrors Array.prototype.find semantics.
 */
export const find = <V>(
  map: t.TimecodeMap<V>,
  predicate: (entry: t.TimecodeEntry<V>) => boolean,
): t.TimecodeEntry<V> | undefined => {
  const entries = toEntries(map); // canonical, sorted by ms
  return entries.find(predicate);
};

/**
 * Find the latest entry whose timestamp ≤ target time (in seconds).
 */
export const findAtOrBefore = <V>(
  map: t.TimecodeMap<V>,
  secs: number,
): t.TimecodeEntry<V> | undefined => {
  const entries = toEntries(map);
  const target = Math.floor(secs * 1000);
  let lo = 0,
    hi = entries.length - 1,
    best = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const ms = entries[mid].ms;
    if (ms <= target) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best >= 0 ? entries[best] : undefined;
};

/**
 * Return the previous and next entries around the given time (in seconds).
 */
export const neighbors = <V>(
  map: t.TimecodeMap<V>,
  secs: number,
): { readonly prev?: t.TimecodeEntry<V>; readonly next?: t.TimecodeEntry<V> } => {
  const entries = toEntries(map);
  const target = Math.floor(secs * 1000);

  // index of last ms <= target
  let lo = 0,
    hi = entries.length - 1,
    prevIdx = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (entries[mid].ms <= target) {
      prevIdx = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  const nextIdx = prevIdx + 1;

  return {
    prev: prevIdx >= 0 ? entries[prevIdx] : undefined,
    next: nextIdx < entries.length ? entries[nextIdx] : undefined,
  };
};

/**
 * Return all entries whose timestamps fall within [start, end).
 */
export const between = <V>(
  map: t.TimecodeMap<V>,
  startSecs: number,
  endSecs: number,
): readonly t.TimecodeEntry<V>[] => {
  const entries = toEntries(map);
  const a = Math.floor(startSecs * 1000);
  const b = Math.floor(endSecs * 1000);
  if (!(a < b)) return [];
  // entries already sorted ⇒ single pass filter
  return entries.filter((e) => e.ms >= a && e.ms < b);
};

/**
 * Return the N entries closest to the given time (in seconds),
 * sorted by absolute temporal distance.
 */
export const nearest = <V>(
  map: t.TimecodeMap<V>,
  secs: number,
  n: number,
): readonly t.TimecodeEntry<V>[] => {
  const entries = toEntries(map);
  const target = Math.floor(secs * 1000);
  if (n <= 0 || entries.length === 0) return [];
  return [...entries]
    .sort((a, b) => {
      const da = Math.abs(a.ms - target);
      const db = Math.abs(b.ms - target);
      return da === db ? a.ms - b.ms : da - db;
    })
    .slice(0, Math.min(n, entries.length));
};
