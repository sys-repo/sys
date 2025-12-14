import type { t } from './common.ts';

/** Type exports: */
export type * from './t.runtime.ts';

/**
 * Runtime adapter for Timecode playback.
 */
export type TimecodePlaybackLib = {
  /**
   * Create a runtime-backed playback runner.
   *
   * This binds the pure Timecode playback state machine
   * to an imperative media runtime.
   */
  readonly runner: (args: t.PlaybackRunnerArgs) => t.PlaybackRunner;
};
