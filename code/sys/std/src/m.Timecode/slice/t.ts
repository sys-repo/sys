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
  is(input: unknown): input is TimecodeSliceString;

  /** Parse a valid slice string into a normalized structure. */
  parse(input: TimecodeSliceStringInput): TimecodeSliceNormalized;

  /** Resolve a parsed slice into an absolute millisecond window against total duration. */
  resolve(slice: TimecodeSliceNormalized, total: t.Msecs): TimeWindow;

  /**
   * Render a parsed slice back to its canonical string form.
   * Rules:
   *  - abs(ms)   → "HH:MM:SS(.mmm)"
   *  - open      → ""
   *  - relEnd(ms)→ "-" + "HH:MM:SS(.mmm)"
   * Example: {start: open, end: abs(60000)} → "..00:01:00"
   */
  toString(slice?: string | TimecodeSliceNormalized): TimecodeSliceString;

  /**
   * Build a canonical slice string from a concrete window
   * (the inverse of `Slice.resolve`).
   * If `total` is provided:
   *  - when from === 0, start is open ("")
   *  - when to === total, end is open ("")
   *  - may be extended later to optionally emit relEnd for end-bound
   * Without `total`, emits absolute times for both ends.
   * Examples:
   *  - fromWindow({from:0,to:60000}, 60000) → "..00:01:00"
   *  - fromWindow({from:10000,to:20000})    → "00:00:10..00:00:20"
   */
  from(window: t.TimeWindow, total?: t.Msecs): TimecodeSliceString;

  /**
   * Split a slice string (e.g. "00:00:05..00:00:10", "..00:00:10", "00:00:05..")
   * into friendly {start,end} parts without validation.
   */
  split(input?: string | TimecodeSliceNormalized): t.TimecodeSliceParts;

  /**
   * Compute duration between slice bounds.
   */
  duration(
    slice: string | TimecodeSliceNormalized,
    opts?: { unit?: t.TimeUnit; round?: number; total?: t.Msecs },
  ): t.TimecodeSliceDuration | undefined;

  /**
   * Compute formatted start/end summaries for a slice.
   * - Returns undefined if slice cannot be resolved.
   */
  positions(
    slice: string | TimecodeSliceNormalized,
    opts?: { round?: number; total?: t.Msecs },
  ): t.TimecodeSlicePositions | undefined;

  /**
   * Convert a slice into a millisecond span [from,to).
   */
  toRange(input?: t.TimecodeSliceStringInput, total?: t.Secs): t.MsecSpan | undefined;
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
