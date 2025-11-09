import type { t } from './common.ts';

/**
 * Library of pure functional operations over canonical TimeMap data.
 * All functions are referentially transparent and side-effect free.
 */
export type TimecodeOpsLib = {
  /**
   * Return the first entry matching a predicate.
   * Mirrors Array.prototype.find semantics.
   */
  readonly find: <V>(
    map: t.TimecodeMap<V>,
    predicate: (entry: t.TimecodeEntry<V>) => boolean,
  ) => t.TimecodeEntry<V> | undefined;

  /**
   * Find the latest entry whose timestamp ≤ target time (in seconds).
   */
  readonly findAtOrBefore: <V>(
    map: t.TimecodeMap<V>,
    secs: number,
  ) => t.TimecodeEntry<V> | undefined;

  /**
   * Return the previous and next entries around the given time (in seconds).
   */
  readonly neighbors: <V>(
    map: t.TimecodeMap<V>,
    secs: number,
  ) => { readonly prev?: t.TimecodeEntry<V>; readonly next?: t.TimecodeEntry<V> };

  /**
   * Return all entries whose timestamps fall within [start, end).
   */
  readonly between: <V>(
    map: t.TimecodeMap<V>,
    startSecs: number,
    endSecs: number,
  ) => readonly t.TimecodeEntry<V>[];

  /**
   * Return the N entries closest to the given time (in seconds),
   * sorted by absolute temporal distance.
   */
  readonly nearest: <V>(
    map: t.TimecodeMap<V>,
    secs: number,
    n: number,
  ) => readonly t.TimecodeEntry<V>[];
};
