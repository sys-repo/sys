import type { t } from './common.ts';

/** Slug-specific playback spec: generic timecode spec + our beat payload. */
export type SlugPlaybackSpec = t.TimecodePlaybackSpec<t.SlugSequenceBeatPayload>;

/**
 * Lift a normalized slug sequence into the generic playback spec.
 * No IO, no manifests – pure struct reshaping.
 */
export type ToSlugPlaybackSpec = (args: {
  readonly normalized: t.SlugSequenceNormalized;
}) => t.SlugPlaybackSpec;

/** Slug-scoped wrapper around the generic media resolver. */
export type SlugMediaResolver = t.MediaResolver;

/** Bundle of "what to play" + "how to resolve its media". */
export type SlugPlaybackBundle = {
  readonly spec: t.SlugPlaybackSpec;
  readonly resolveMedia: t.SlugMediaResolver;
};
