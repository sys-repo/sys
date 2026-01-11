import { type t } from './common.ts';

/**
 * Resolve the beat index that owns vTime (media + pause span).
 */
export const beatIndexAtVTime: t.PlaybackStateUtilLib['beatIndexAtVTime'] = (timeline, vTime) => {
  const beats = timeline.beats;
  if (beats.length === 0) return 0 as t.PlaybackBeatIndex;

  // Find beat where vTime is within [beat.vTime, beat.vTime + duration + pause).
  for (let i = beats.length - 1; i >= 0; i--) {
    const beat = beats[i];
    const from = beat.vTime;
    const pause = beat.pause ?? 0;
    const to = (beat.vTime + beat.duration + pause) as t.Msecs;
    if (vTime >= from && vTime < to) return beat.index;
  }

  if (vTime < beats[0].vTime) return beats[0].index;
  return beats[beats.length - 1].index;
};
