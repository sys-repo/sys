import type { t } from './common.ts';

/** Slug-specific playback spec: generic timecode spec + our beat payload. */
export type SlugPlaybackSpec = t.TimecodePlaybackSpec<t.SequenceBeatPayload>;

/**
 * Lift a normalized slug sequence into the generic playback spec.
 * No IO, no manifests – pure struct reshaping.
 */
export type ToSlugPlaybackSpec = (input: {
  readonly normalized: t.SequenceNormalized;
}) => t.SlugPlaybackSpec;
