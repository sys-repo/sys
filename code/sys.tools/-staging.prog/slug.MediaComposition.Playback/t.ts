import type { t } from './common.ts';

/**
 * Playback-time pipeline:
 *   normalized → playback spec.
 */
export type PlaybackLib = {
  readonly fromNormalized: t.ToSlugPlaybackSpec;
};

/** Slug-specific playback spec: generic timecode spec + our beat payload. */
export type SlugPlaybackSpec = t.TimecodePlaybackSpec<t.SlugSequenceBeatPayload> & {
  readonly docid: t.Crdt.Id;
  readonly meta?: t.SlugSequenceNormalized['meta'];
};

/**
 * Lift a normalized slug sequence into the generic playback spec.
 */
export type ToSlugPlaybackSpec = (
  docid: t.Crdt.Id,
  normalized: t.SlugSequenceNormalized,
) => t.SlugPlaybackSpec;

/** Slug-scoped wrapper around the generic media resolver. */
export type SlugMediaResolver = t.MediaResolver;

/** Bundle of "what to play" + "how to resolve its media". */
export type SlugPlaybackBundle = {
  readonly spec: t.SlugPlaybackSpec;
  readonly resolveMedia: t.SlugMediaResolver;
};
