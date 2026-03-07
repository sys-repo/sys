import type { t } from './common.ts';

export type * from './t.timeline.ts';
export type * from './t.map.ts';

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

  /** Mapping helpers between virtual-time and source-time domains. */
  readonly Map: t.TimecodeCompositeMapLib;

  /** Small time utilities on the virtual timeline. */
  readonly Time: {
    /** Clamp a virtual time into [0,total]. */
    clamp(v: t.TimecodeVTime, total: t.Msecs): t.TimecodeVTime;
    /** Convert a source timestamp inside a segment to virtual time. */
    toVirtual(
      segments: t.Ary<t.TimecodeResolvedSegment>,
      index: number,
      srcTime: t.Msecs,
    ): t.TimecodeVTime;
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
    probe(srcs: readonly string[]): Promise<t.TimecodeDurationMap>;
    /** List srcs whose duration changed. */
    diff(prev: t.TimecodeDurationMap, next: t.TimecodeDurationMap): readonly string[];
    /** Return a normalized spec with missing durations filled from map. */
    with(spec: t.TimecodeCompositionSpec, map: t.TimecodeDurationMap): t.TimecodeCompositionSpec;
  };

  /** Indexing helpers over a resolved composition. */
  cursor(resolved: t.TimecodeCompositionResolved): {
    /** Lookup segment at virtual time (or null if out of range). */
    at(v: t.TimecodeVTime): t.TimecodeMapToSourceResult | null;
    /** Next segment index or null if none. */
    next(index: number): number | null;
    /** Previous segment index or null if none. */
    prev(index: number): number | null;
  };

  /** Pure transforms on resolved timelines. */
  readonly Ops: {
    /** Insert pieces at segment boundary; returns a new resolved timeline. */
    splice(
      resolved: t.TimecodeCompositionResolved,
      at: number,
      pieces: t.TimecodeCompositionSpec,
      durations: t.TimecodeDurationMap,
    ): t.TimecodeCompositionResolved;

    /** Concatenate two resolved timelines, rebasing vFrom/vTo. */
    concat(
      a: t.TimecodeCompositionResolved,
      b: t.TimecodeCompositionResolved,
    ): t.TimecodeCompositionResolved;
  };

  /**
   * Build a purely-virtual resolved timeline from authoring spec only.
   *
   * Resolution rules (no environment metadata is consulted):
   * - Length is determinable when either:
   *    - slice is absolute "START..END" → len = END - START
   *    - OR a `duration` is supplied on the piece:
   *       - "..END"        → len = END - 0
   *       - "START.."      → len = duration - START
   *       - "START..-X"    → len = duration - START - X
   *       - ".." or no slice → len = duration
   * - Pieces whose length cannot be determined are excluded from `segments` and
   *   reported as issues (see `unresolved-length`). Zero/negative lengths are dropped.
   * - Segments are emitted contiguously on the virtual axis via accumulated lengths.
   * - Always returns an object; use `is.empty` and `is.valid` for quick checks.
   */
  readonly toVirtualTimeline: (spec?: t.TimecodeCompositionSpec) => t.TimecodeResolved;
};

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
  /** Source reference (URL, hash, or URN etc). */
  readonly src: t.StringRef;
  /** Optional slice window within the source. */
  readonly slice?: string | t.TimecodeSliceString;
  /** Optional total duration of the source media (ms). */
  readonly duration?: t.Msecs;
};

/** Authoring-time composition: an ordered list of pieces. */
export type TimecodeCompositionSpec = TimecodeCompositePiece[];

/** Duration (ms) per source URL, supplied post metadata load. */
export type TimecodeDurationMap = Readonly<Record<string, t.Msecs>>;

/**
 * Resolved segment against real source metadata.
 * - `original` → [from,to) in the original media (absolute ms within that file).
 * - `virtual`  → [from,to) on the composite timeline (absolute ms on the constructed timeline).
 * Invariants: original.to > original.from, virtual.to > virtual.from.
 */
export type TimecodeResolvedSegment = {
  readonly src: t.StringRef;
  readonly original: t.MsecSpan;
  readonly virtual: t.MsecSpan;
};

/** Resolved composition and its total virtual duration. */
export type TimecodeCompositionResolved = {
  readonly total: t.Msecs;
  readonly segments: readonly TimecodeResolvedSegment[];
};

/** Virtual-time alias for clarity. */
export type TimecodeVTime = t.Msecs;

/** Absolute time (ms) within the *source* media asset. */
export type TimecodeSrcTime = t.Msecs;

/**
 * Time (ms) relative to the start of a slice window.
 * Domain: [0, sliceLength).
 */
export type TimecodeSliceTime = t.Msecs;

/**
 * Concrete resolved slice window within the source asset.
 * Semantics: inclusive start, exclusive end.
 */
export type TimecodeSliceWindow = t.MsecSpan;

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
  segments: readonly t.TimecodeResolvedSegment[],
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
