import { type t } from './common.ts';

/**
 * Derive active phase (media vs pause) for a beat at vTime.
 */
export const activePhase: t.PlaybackStateUtilLib['activePhase'] = (timeline, beatIndex, vTime) => {
  const beat = timeline.beats[beatIndex];
  if (!beat) return undefined;

  const next = timeline.beats[Number(beatIndex) + 1];
  const totalSpanMs = next
    ? Number(next.vTime) - Number(beat.vTime)
    : Number(timeline.virtualDuration) - Number(beat.vTime);

  const pauseMs = Number(beat.pause ?? 0);
  const mediaSpanMs = Math.max(0, Math.max(0, totalSpanMs) - pauseMs);

  const pauseFrom = Number(beat.vTime) + mediaSpanMs;
  const pauseTo = pauseFrom + pauseMs;
  const t = Number(vTime);

  if (pauseMs > 0 && t >= pauseFrom && t < pauseTo) return 'pause';
  return 'media';
};
