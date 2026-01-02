import { type t, D } from './common.ts';

/**
 * Pure: build the ui-state Playback.Timeline from a resolved experience timeline
 * plus the wire-format bundle.
 *
 * Notes:
 * - beat.duration is MEDIA time (pause excluded)
 * - beat.pause is the semantic pause after the beat
 * - segments are derived by grouping consecutive beats by src.ref
 */
export function buildPlaybackTimeline<P>(args: {
  timeline: t.Timecode.Experience.Timeline<P>;
  bundle: t.SpecTimelineBundle<P>;
}): t.TimecodeState.Playback.Timeline {
  const { timeline } = args;
  const beatsIn = timeline.beats;
  const beats: t.TimecodeState.Playback.Beat[] = [];
  const segments: t.TimecodeState.Playback.Segment[] = [];

  if (beatsIn.length === 0) {
    return { beats, segments, virtualDuration: timeline.duration };
  }

  let segFrom = 0 as t.TimecodeState.Playback.BeatIndex;
  let segId = segmentIdFromBeat(beatsIn[0]);

  for (let i = 0; i < beatsIn.length; i++) {
    const curr = beatsIn[i]!;
    const nextVTime = i + 1 < beatsIn.length ? beatsIn[i + 1]!.vTime : timeline.duration;

    const from = Number(curr.vTime);
    const to = Math.max(from, Number(nextVTime));
    const totalSpan = Math.max(0, to - from);

    const pauseN = Math.max(0, Number(curr.pause ?? 0));
    const durN = Math.max(0, totalSpan - pauseN);

    const index: t.TimecodeState.Playback.BeatIndex = i;
    const currSegId = segmentIdFromBeat(curr);

    // Segment boundary: close prior on id change.
    if (i > 0 && currSegId !== segId) {
      segments.push({
        id: segId,
        beat: { from: segFrom, to: i },
      });

      segId = currSegId;
      segFrom = i;
    }

    beats.push({
      index,
      vTime: curr.vTime,
      duration: durN as t.Msecs,
      pause: pauseN > 0 ? (pauseN as t.Msecs) : undefined,
      segmentId: segId,
    });
  }

  // Close final segment.
  segments.push({
    id: segId,
    beat: { from: segFrom, to: beatsIn.length },
  });

  return {
    beats,
    segments,
    virtualDuration: timeline.duration,
  };
}

/**
 * Helpers:
 */
function segmentIdFromBeat<P>(
  beat: t.Timecode.Experience.Timeline<P>['beats'][number],
): t.StringId {
  const ref = beat.src.ref;

  // Structural invariant for segmenting; fail loudly.
  if (ref.length === 0) {
    throw new Error(`${D.name}: beat.src.ref is required (vTime=${beat.vTime})`);
  }
  return ref as t.StringId;
}
