import type { t } from '../common.ts';

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

/** Looser param input for a timecode slice, eg. 'HH:MM:SS(.mmm)' */
export type TimecodeSliceStringInput = TimecodeSliceString | string;

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
export type TimecodeSliceNormalized = {
  readonly raw: TimecodeSliceString;
  readonly start: TimecodeSliceBound;
  readonly end: TimecodeSliceBound;
};

/**
 * Resolved concrete window in milliseconds.
 *
 * Semantics: inclusive start, exclusive end: [from, to).
 * - `from` is included.
 * - `to` is excluded.
 */
export type TimeWindow = {
  readonly from: t.Msecs;
  readonly to: t.Msecs;
};

/** Friendly lexical representation of a slice's textual bounds. */
export type TimecodeSliceParts = {
  readonly start: string;
  readonly end: string;
};

/** Duration summary of a time slice. */
export type TimecodeSliceDuration = {
  readonly ms: t.Msecs;
  readonly text: string;
};

/** Formatted lexical start/end of a time slice. */
export type TimecodeSlicePositions = {
  readonly start: string;
  readonly end: string;
};
