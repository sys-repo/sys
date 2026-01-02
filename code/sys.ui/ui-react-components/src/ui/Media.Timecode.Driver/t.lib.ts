import type { t } from './common.ts';
import type * as R from './t.runtime.ts';

/**
 * Timecode Driver
 */
export type TimecodeDriverLib = {
  readonly Playback: t.TimecodeDriverPlaybackLib;
};

/**
 * Playback boundary: connects the playback state machine to real video playback.
 */
export type TimecodeDriverPlaybackLib = {
  /** Runtime bridge between reducer cmds/signals and the video decks. */
  driver(args: R.CreatePlaybackDriverArgs): R.PlaybackDriver;

  /** UI control surface that emits playback actions. */
  controller(dispatch: (input: t.TimecodeState.Playback.Input) => void): R.TimelineController;
};
