import type { t } from './common.ts';

/**
 * Timeline read-model (UI-friendly, derived).
 *
 * Pure projection of PlaybackState.timeline + currentBeat into a stable shape
 * suitable for tables, highlights, and lightweight subscriptions.
 */
export type PlaybackTimelineReadModel = {
  readonly virtualDuration: t.Msecs;
  readonly current?: PlaybackTimelineCurrent;
  readonly beats: readonly PlaybackTimelineBeat[];
};

export type PlaybackTimelineCurrent = {
  readonly index: t.TimecodeState.Playback.BeatIndex;
  readonly vTime: t.Msecs;
  readonly segmentId: t.StringId;
};

export type PlaybackTimelineBeatPos = 'Past' | 'Current' | 'Future';

export type PlaybackTimelineBeat = {
  readonly index: t.TimecodeState.Playback.BeatIndex;
  readonly vTime: t.Msecs;
  readonly duration: t.Msecs;
  readonly pause?: t.Msecs;
  readonly segmentId: t.StringId;
  readonly media?: t.TimecodeState.Playback.Beat['media'];

  /**
   * Derived position relative to currentBeat.
   */
  readonly pos: PlaybackTimelineBeatPos;

  /**
   * Derived: true when this beat starts a new segment.
   * Useful for table grouping / row separators.
   */
  readonly isSegmentStart: boolean;
};
