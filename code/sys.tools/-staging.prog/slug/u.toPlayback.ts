import { type t } from './common.ts';

/**
 * Lift a normalized slug sequence into the generic playback spec.
 */
export const toPlayback: t.ToSlugPlaybackSpec = (docid, normalized) => {
  const { timecode: composition, beats, meta } = normalized;
  return {
    docid,
    composition,
    beats,
    meta,
  };
};
