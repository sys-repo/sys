import type { t } from './common.ts';

export type * from './t.lib.ts';

/**
 * Timestamp-aligned semantic unit projected via a composite timeline.
 *
 * `P` is intentionally unconstrained — @sys/std only knows that there *is*
 * some payload. Higher layers define its shape.
 */
export type TimecodeExperienceBeat<P = unknown> = {
  /**
   * Original media reference and position.
   * This is the ground-truth source coordinate the virtual timeline is
   * ultimately derived from.
   */
  readonly src: {
    /** Identifier of the backing media source (URL, hash, or URN). */
    readonly ref: t.StringRef;
    /** Position within the original media source (ms). */
    readonly time: t.Msecs;
  };

  /**
   * Optional semantic pause to apply at this beat when composing the
   * experience timeline.
   */
  readonly pause?: t.Msecs;

  /** Domain-defined payload (overlays, metadata, etc). */
  readonly payload: P;
};

/**
 * A beat enriched with its position on the virtual experience timeline.
 */
export type TimecodeTimelineBeat<P = unknown> = TimecodeExperienceBeat<P> & {
  /** Virtual time (ms) after factoring in composition and accumulated pauses. */
  readonly vTime: t.Msecs;
};

/**
 * Ordered projection of beats onto a virtual time axis.
 */
export type TimecodeTimeline<P = unknown> = {
  /** Beats ordered by increasing virtual time. */
  readonly beats: readonly TimecodeTimelineBeat<P>[];

  /**
   * Total virtual duration (ms) of the experience.
   * Includes pauses and any other semantic extensions.
   */
  readonly duration: t.Msecs;
};

/**
 * Fully-resolved experience: composition plus its beat-level timeline.
 */
export type TimecodeExperience<P = unknown> = {
  /** Authoring-time composite specification for the underlying media. */
  readonly composition: t.TimecodeCompositionSpec;

  /** Beat-level projection on the virtual time axis. */
  readonly timeline: TimecodeTimeline<P>;

  /** Optional provenance or caller-defined metadata. */
  readonly meta?: {
    readonly source?: string;
    readonly createdAt?: t.UnixTimestamp;
  };
};
