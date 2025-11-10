import type { t } from '../common.ts';

/**
 * Helpers parsing and resolving timecode slice strings - "<from>..<to>"
 *
 * Semantics:
 *  - is():     fast check that "<from>..<to>" is present and roughly well-formed.
 *  - parse():  split and classify bounds (abs/open/relEnd).
 *  - resolve(totalMs): convert parsed bounds into a concrete [from,to) window.
 *
 * Resolution rules:
 *  - start.open  → 0
 *  - end.open    → totalMs
 *  - relEnd ms   → totalMs - ms
 *  - Clamped into [0,totalMs] and coerced so that from <= to.
 */
export type TimecodeSliceLib = {
  /** Quick structural check for the slice lexical form. */
  readonly is: (input: unknown) => input is TimecodeSliceString;

  /** Parse a valid slice string into a normalized structure. */
  readonly parse: (input: TimecodeSliceString) => TimecodeSlice;

  /** Resolve a parsed slice into an absolute millisecond window against total duration. */
  readonly resolve: (slice: TimecodeSlice, total: t.Msecs) => TimeWindowMs;
};

/**
 * String form of a slice:
 *   "<from>..<to>"
 *
 * Where <from> or <to> are any of:
 *   - VTT timecode  → "HH:MM:SS(.mmm)"
 *   - empty         → open-bound (start or end)
 *   - negative VTT  → relative-from-end (eg: "-00:00:05")
 *
 * Examples:
 *   "00:00:20..00:00:35"     // absolute window
 *   "..00:00:10"             // open start → from 0 to 10s
 *   "00:10.."                // open end → from 10s to total
 *   "00:00:05..-00:00:02"    // from 5s to 2s before the end
 */
export type TimecodeSliceString = string & { readonly __brand: 'TimecodeSliceString' };

/**
 * Bound kinds:
 *   - abs:   absolute millisecond timestamp from 0
 *   - open:  unspecified; resolve() maps to 0 (start) or total (end)
 *   - relEnd: relative-to-end offset in ms (eg: "-00:00:05" → last 5s)
 */
export type TimecodeSliceBound =
  | { readonly kind: 'abs'; readonly ms: t.Msecs }
  | { readonly kind: 'open' }
  | { readonly kind: 'relEnd'; readonly ms: t.Msecs };

/** Parsed slice: normalized structure derived from the raw string. */
export type TimecodeSlice = {
  readonly raw: TimecodeSliceString;
  readonly start: TimecodeSliceBound;
  readonly end: TimecodeSliceBound;
};

/** Resolved concrete window in milliseconds (inclusive start, exclusive end). */
export type TimeWindowMs = {
  readonly from: t.Msecs;
  readonly to: t.Msecs;
};
