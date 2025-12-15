import type { t } from './common.ts';

/**
 * Pure UI intent → playback inputs.
 *
 * No side-effects.
 * No runtime access.
 * No scheduling.
 */
export type TimelineController = {
  play(): t.PlaybackRunnerInput;
  pause(): t.PlaybackRunnerInput;
  toggle(): t.PlaybackRunnerInput;
  seekToBeat(index: t.TimecodeState.Playback.BeatIndex): t.PlaybackRunnerInput;
};
