import type { t } from './common.ts';

/**
 * Pure: project PlaybackState → Timeline read-model.
 */
export function projectTimeline(
  state: t.TimecodeState.Playback.State,
): t.PlaybackTimelineReadModel {
  const timeline = state.timeline;
  if (!timeline) return empty();

  const currentBeat = state.currentBeat;
  const beats = timeline.beats.map((b, i) => {
    const prev = i > 0 ? timeline.beats[i - 1] : undefined;

    const pos: t.PlaybackTimelineBeatPos =
      currentBeat === undefined
        ? 'Future'
        : b.index < currentBeat
          ? 'Past'
          : b.index === currentBeat
            ? 'Current'
            : 'Future';

    return {
      index: b.index,
      vTime: b.vTime,
      duration: b.duration,
      pause: b.pause,
      segmentId: b.segmentId,
      media: b.media,
      pos,
      isSegmentStart: prev ? prev.segmentId !== b.segmentId : true,
    };
  });

  const current =
    currentBeat === undefined
      ? undefined
      : (() => {
          const b = timeline.beats.find((x) => x.index === currentBeat);
          if (!b) return undefined;
          return { index: b.index, vTime: b.vTime, segmentId: b.segmentId };
        })();

  return {
    virtualDuration: timeline.virtualDuration,
    current,
    beats,
  };
}

function empty(): t.PlaybackTimelineReadModel {
  return { virtualDuration: 0, beats: [] };
}
