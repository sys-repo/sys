import type { t } from './common.ts';

/**
 * Canonical library of pure, programmatic operations for working with
 * composite time-based media structures (e.g. multi-clip video timelines).
 *
 * Designed to be UI-agnostic and deterministic: all functions are pure,
 * side-effect-free, and accept/return plain data objects.
 *
 * The library provides compositional primitives for:
 *  - sequencing and synchronizing multiple timecoded tracks,
 *  - trimming and cropping via canonical time ranges,
 *  - merging, splitting, and offsetting clip segments,
 *  - querying and mapping between absolute and relative time domains.
 *
 * Used internally by higher-order systems (e.g. player, editor, CRDT sync)
 * as the low-level substrate for timecode composition logic.
 */
export type TimecodeCompositeLib = {
  /** Build a resolved timeline from authoring spec + known durations. */
  readonly resolve: t.TimecodeResolveComposition;

  /**
   * Map a virtual time to its backing source segment/time.
   */
  readonly mapToSource: t.TimecodeMapToSource;

  /** Small time utilities on the virtual timeline. */
  readonly Time: {
    /** Convert a source timestamp inside a segment to virtual time. */
    readonly toVirtual: (
      segments: readonly t.TimecodeResolvedSegment[],
      index: number,
      srcTime: t.Msecs,
    ) => t.TimecodeVTime;

    /** Clamp a virtual time into [0,total]. */
    readonly clamp: (v: t.TimecodeVTime, total: t.Msecs) => t.TimecodeVTime;
  };

  /** Validate spec+durations for composability; never throws. */
  validate(
    spec: t.TimecodeCompositionSpec,
    durations: t.TimecodeDurationMap,
  ): { readonly ok: boolean; readonly issues: readonly TimecodeCompositeIssue[] };

  /** Sanitize authoring input (trim, drop empty slices, normalise tuples, etc.). */
  normalize(spec: t.TimecodeCompositionSpec): t.TimecodeCompositionSpec;

  /** Duration helpers (env-specific probing is left to caller; this is the contract). */
  readonly Durations: {
    /** Resolve durations per src (implementation may be provided by host app). */
    readonly probe: (srcs: readonly string[]) => Promise<t.TimecodeDurationMap>;
    /** List srcs whose duration changed. */
    readonly diff: (prev: t.TimecodeDurationMap, next: t.TimecodeDurationMap) => readonly string[];
  };

  /** Indexing helpers over a resolved composition. */
  cursor(resolved: t.TimecodeCompositionResolved): {
    /** Lookup segment at virtual time (or null if out of range). */
    readonly at: (v: t.TimecodeVTime) => t.TimecodeMapToSourceResult | null;
    /** Next segment index or null if none. */
    readonly next: (index: number) => number | null;
    /** Previous segment index or null if none. */
    readonly prev: (index: number) => number | null;
  };

  /** Pure transforms on resolved timelines. */
  readonly Ops: {
    /** Insert pieces at segment boundary; returns a new resolved timeline. */
    readonly splice: (
      resolved: t.TimecodeCompositionResolved,
      at: number,
      pieces: t.TimecodeCompositionSpec,
      durations: t.TimecodeDurationMap,
    ) => t.TimecodeCompositionResolved;

    /** Concatenate two resolved timelines, rebasing vFrom/vTo. */
    readonly concat: (
      a: t.TimecodeCompositionResolved,
      b: t.TimecodeCompositionResolved,
    ) => t.TimecodeCompositionResolved;
  };
};

/**
 * TODO 🐷 to Msecs
 */

/** Specifies a time range to narrow within. */
export type TimecodeCropRange = { start: t.Secs; end: t.Secs };
export type TimecodeCropRangeTuple = [t.Secs, t.Secs];

/**
 * Validation/diagnostic issues emitted by Composite.validate.
 */
export type TimecodeCompositeIssue =
  | { readonly kind: 'missing-duration'; readonly src: string }
  | { readonly kind: 'invalid-slice'; readonly src: string; readonly slice: string }
  | { readonly kind: 'zero-length-segment'; readonly src: string };

/**
 * A single piece of source media in the composition.
 * Optional slice narrows the playable window within the source.
 * Optional crop mirrors the lower-level element API (pass-through).
 */
export type TimecodeCompositePiece = {
  src: string;
  slice?: string | t.TimecodeSliceString;
  crop?: t.TimecodeCropRange | t.TimecodeCropRangeTuple;
};

/** Authoring-time composition: an ordered list of pieces. */
export type TimecodeCompositionSpec = TimecodeCompositePiece[];

/** Duration (ms) per source URL, supplied post metadata load. */
export type TimecodeDurationMap = Readonly<Record<string, t.Msecs>>;

/**
 * Resolved segment against real source metadata.
 * - [from,to) are absolute milliseconds within the source asset.
 * - [vFrom,vTo) are absolute milliseconds on the composite (virtual) timeline.
 */
export type TimecodeResolvedSegment = {
  readonly src: string;
  readonly from: t.Msecs;
  readonly to: t.Msecs;
  readonly vFrom: t.Msecs;
  readonly vTo: t.Msecs;
  readonly crop?: t.TimecodeCropRange | t.TimecodeCropRangeTuple;
};

/** Resolved composition and its total virtual duration. */
export type TimecodeCompositionResolved = {
  readonly segments: readonly TimecodeResolvedSegment[];
  readonly total: t.Msecs;
};

/** Virtual-time alias for clarity. */
export type TimecodeVTime = t.Msecs;

/**
 * Map a virtual time position into a concrete source-time within a segment.
 * Returns null if the composition is empty or the time is outside [0,total).
 */
export type TimecodeMapToSourceResult = {
  readonly index: number;
  readonly seg: TimecodeResolvedSegment;
  /** Absolute ms within the source asset for this virtual time. */
  readonly srcTime: t.Msecs;
  /** vTime offset from the start of the segment on the virtual timeline. */
  readonly offset: t.Msecs; // = vTime - seg.vFrom
};

export type TimecodeMapToSource = (
  segments: readonly TimecodeResolvedSegment[],
  vTime: TimecodeVTime,
) => TimecodeMapToSourceResult | null;

/**
 * Resolver: transforms an authoring spec + known durations into an executable timeline.
 * - durations: ms per src URL (must be supplied by caller after metadata load).
 * - Slices are resolved using Timecode.Slice rules.
 * - Zero-length results are dropped.
 */
export type TimecodeResolveComposition = (
  spec: TimecodeCompositionSpec,
  durations: TimecodeDurationMap,
) => TimecodeCompositionResolved;

/**
 * Minimal event surface for a composite orchestrator (no UI assumptions).
 * A future React wrapper can lift these directly.
 */
export type TimecodeCompositeEvents = {
  readonly onReady?: (e: { readonly total: t.Msecs }) => void;
  readonly onTime?: (e: { readonly time: t.Msecs }) => void;
  readonly onEnded?: () => void;
};

/**
 * Optional control intents the orchestrator may expose upward.
 */
export type TimecodeCompositeControls = {
  readonly play: () => Promise<void> | void;
  readonly pause: () => void;
  readonly seek: (time: TimecodeVTime) => void;
};

/**
 * A thin, environment-agnostic orchestration contract:
 * - The orchestrator owns resolution + mapping.
 */
export type TimecodeCompositeOrchestrator = {
  readonly spec: TimecodeCompositionSpec;
  readonly resolved: TimecodeCompositionResolved;
  readonly mapToSource: TimecodeMapToSource;
  readonly controls: TimecodeCompositeControls;
  readonly events?: TimecodeCompositeEvents;
};
