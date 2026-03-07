import type { t } from './common.ts';

/**
 * Source anchor for a runtime playback beat.
 *
 * This is *resolver-addressable* identity (kind + logicalPath) plus the
 * source-time coordinate used for timeline mapping.
 *
 * - `kind`        → media category the resolver understands ('video' | 'image')
 * - `logicalPath` → stable, resolver-facing identifier (typically a path from YAML)
 * - `time`        → absolute ms within the source media (not virtual timeline time)
 * - `slice`       → optional authoring hint (non-semantic) retained for debug/UX
 */
export type TimecodePlaybackBeatSrc = {
  readonly kind: PlaybackMediaKind;
  readonly logicalPath: t.StringPath;
  readonly time: t.Msecs;

  /** Optional authoring hint for debug/UX (no playback semantics). */
  readonly slice?: string | t.TimecodeSliceString;
};

/**
 * Beat shape for runtime playback.
 * Uses resolver-addressable media identity (kind + logicalPath),
 * while retaining source time anchoring for mapping.
 */
export type TimecodePlaybackBeat<P = unknown> = {
  readonly src: TimecodePlaybackBeatSrc;
  readonly pause?: t.Msecs;
  readonly payload: P;
};

/**
 * Generic playback contract for a timecoded experience.
 *
 * `P` is the payload attached to beats (overlay UI, metadata, etc).
 */
export type TimecodePlaybackSpec<P> = {
  readonly composition: t.TimecodeCompositionSpec;
  readonly beats: readonly t.TimecodePlaybackBeat<P>[];
};

/** Media kinds the playback layer knows how to resolve. */
export type PlaybackMediaKind = 'video' | 'image';

/** Input to the media resolver. */
export type MediaResolverArgs = {
  readonly kind: PlaybackMediaKind;
  readonly logicalPath: t.StringPath;
};

/**
 * Resolve a logical media ref to a concrete URL / href.
 * Returns `undefined` when the media is not available.
 */
export type MediaResolver = (args: MediaResolverArgs) => string | undefined;
