import { type t } from './common.ts';

/**
 * Validation/diagnostic issues emitted by Composite.validate.
 */
export type VideoCompositeIssue =
  | { readonly kind: 'missing-duration'; readonly src: string }
  | { readonly kind: 'invalid-slice'; readonly src: string; readonly slice: string }
  | { readonly kind: 'zero-length-segment'; readonly src: string };

/**
 * Programmatic API for composite video orchestration (UI-agnostic).
 */
export type CompositeVideoHelpers = {
  /** Build a resolved timeline from authoring spec + known durations. */
  readonly resolve: t.VideoResolveComposition;

  /**
   * Map a virtual time to its backing source segment/time.
   * Usually a thin wrapper over `t.VideoMapToSource`.
   */
  readonly mapToSource: t.VideoMapToSource;

  /** Small time utilities on the virtual timeline. */
  readonly Time: {
    /** Convert a source timestamp inside a segment to virtual time. */
    readonly toVirtual: (
      segments: readonly t.VideoResolvedSegment[],
      index: number,
      srcTime: t.Msecs,
    ) => t.VideoVTime;

    /** Clamp a virtual time into [0,total]. */
    readonly clamp: (v: t.VideoVTime, total: t.Msecs) => t.VideoVTime;
  };

  /** Validate spec+durations for composability; never throws. */
  validate(
    spec: t.VideoCompositionSpec,
    durations: t.VideoDurationMap,
  ): { readonly ok: boolean; readonly issues: readonly VideoCompositeIssue[] };

  /** Sanitize authoring input (trim, drop empty slices, normalise tuples, etc.). */
  normalize(spec: t.VideoCompositionSpec): t.VideoCompositionSpec;

  /** Duration helpers (env-specific probing is left to caller; this is the contract). */
  readonly Durations: {
    /** Resolve durations per src (implementation may be provided by host app). */
    readonly probe: (srcs: readonly string[]) => Promise<t.VideoDurationMap>;
    /** List srcs whose duration changed. */
    readonly diff: (prev: t.VideoDurationMap, next: t.VideoDurationMap) => readonly string[];
  };

  /** Indexing helpers over a resolved composition. */
  cursor(resolved: t.VideoCompositionResolved): {
    /** Lookup segment at virtual time (or null if out of range). */
    readonly at: (v: t.VideoVTime) => t.VideoMapToSourceResult | null;
    /** Next segment index or null if none. */
    readonly next: (index: number) => number | null;
    /** Previous segment index or null if none. */
    readonly prev: (index: number) => number | null;
  };

  /** Pure transforms on resolved timelines. */
  readonly Ops: {
    /** Insert pieces at segment boundary; returns a new resolved timeline. */
    readonly splice: (
      resolved: t.VideoCompositionResolved,
      at: number,
      pieces: t.VideoCompositionSpec,
      durations: t.VideoDurationMap,
    ) => t.VideoCompositionResolved;

    /** Concatenate two resolved timelines, rebasing vFrom/vTo. */
    readonly concat: (
      a: t.VideoCompositionResolved,
      b: t.VideoCompositionResolved,
    ) => t.VideoCompositionResolved;
  };
};
