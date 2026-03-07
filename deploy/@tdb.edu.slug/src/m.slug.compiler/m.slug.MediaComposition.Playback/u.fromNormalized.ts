import { type t } from './common.ts';

/**
 * Lift a normalized slug sequence into the generic playback spec.
 */
export const fromNormalized: t.SlugPlaybackLib['fromNormalized'] = (docid, normalized) => {
  const { meta } = normalized;

  type B = t.Timecode.Playback.Beat<t.SequenceBeatPayload>;
  const beats: readonly B[] = normalized.beats.map((beat) => {
    const { pause, payload } = beat;
    return {
      pause,
      payload,
      src: { kind: 'video', logicalPath: beat.src.ref, time: beat.src.time },
    };
  });

  const composition = normalized.timecode;
  return { docid, composition, beats, meta };
};
