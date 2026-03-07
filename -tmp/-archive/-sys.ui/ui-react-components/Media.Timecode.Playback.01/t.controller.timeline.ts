import type { t } from './common.ts';

/**
 * Imperative UI controller for playback timelines.
 *
 * Responsibilities:
 * - Translate UI intent into runner inputs
 * - Send inputs to the runner
 *
 * Non-responsibilities:
 * - No runtime/media access
 * - No scheduling
 * - No state ownership
 */
export type TimelineController = {
  init(
    timeline: t.TimecodeState.Playback.Timeline,
    startBeat?: t.TimecodeState.Playback.BeatIndex,
  ): void;
  play(): void;
  pause(): void;
  toggle(): void;
  seekToBeat(index: t.TimecodeState.Playback.BeatIndex): void;
};
