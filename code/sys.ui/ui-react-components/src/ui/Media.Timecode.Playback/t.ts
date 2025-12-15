import type { t } from './common.ts';

/** Type exports */
export type * from './t.deck.ts';
export type * from './t.read.timeline.ts';
export type * from './t.runner.loop.ts';
export type * from './t.runtime.ts';

/**
 * Timecode playback runtime adapter.
 */
export type TimecodePlaybackLib = {
  /**
   * Create a runtime-backed playback runner.
   *
   * Binds the pure playback state machine
   * to an imperative media runtime.
   */
  runner(args: t.PlaybackRunnerArgs): t.PlaybackRunner;

  /**
   * React hook binding a playback runner to component lifecycle.
   */
  useRunner(args: t.PlaybackRunnerArgs): t.PlaybackRunnerHook;

  /**
   * Canonical projections (read-models).
   */
  readonly project: {
    readonly runnerState: (state: t.TimecodeState.Playback.State) => t.PlaybackRunnerState;
    readonly timeline: (state: t.TimecodeState.Playback.State) => t.PlaybackTimelineReadModel;
  };
};

/**
 * React-bound playback runner surface.
 */
export type PlaybackRunnerHook = {
  readonly snapshot: t.PlaybackRunnerState;
  readonly send: t.PlaybackRunner['send'];
};
