import { type t } from './common.ts';

/**
 * Lift a normalized slug sequence into the generic playback spec.
 */
export const toSlugPlaybackSpec: t.ToSlugPlaybackSpec = (args) => {
  const { timecode, beats, meta } = args.normalized;
  return {
    composition: timecode,
    beats,
    meta,
  };
};
