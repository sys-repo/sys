import type { t } from './common.ts';
import type * as R from './t.runtime.ts';

/**
 * Playback Driver: connects the playback state machine to real video playback.
 */
export type TimecodePlaybackDriverLib = {
  /** Runtime bridge between reducer cmds/signals and the video decks. */
  create(args: R.CreatePlaybackDriverArgs): R.PlaybackDriver;

  /** UI control surface that emits playback actions. */
  controller(dispatch: (input: t.TimecodeState.Playback.Input) => void): R.TimelineController;
};
