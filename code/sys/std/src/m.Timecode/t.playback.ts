import type { t } from './common.ts';

/**
 * Generic playback contract for a timecoded experience.
 *
 * `P` is the payload attached to beats (overlay UI, metadata, etc).
 */
export type TimecodePlaybackSpec<P> = {
  readonly composition: t.TimecodeCompositionSpec;
  readonly beats: readonly t.TimecodeExperienceBeat<P>[];
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
