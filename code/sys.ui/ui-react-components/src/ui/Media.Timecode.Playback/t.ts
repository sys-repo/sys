import type { t } from './common.ts';

/** Type exports */
export type * from './t.deck.ts';
export type * from './t.read.timeline.ts';
export type * from './t.runner.loop.ts';
export type * from './t.runtime.ts';
export type * from './t.controller.timeline.ts';

/**
 * Playback integration surface.
 *
 * Organizes APIs by purity boundary:
 * - Pure: project, controller
 * - Imperative: runtime, runner (executes cmds against runtime)
 * - React: useRunner
 */
export type TimecodePlaybackLib = {
  /**
   * Create a runtime-backed playback runner.
   *
   * Binds the pure playback state machine to an imperative media runtime:
   * inputs → reduce → cmds → runtime effects → projected snapshot.
   */
  runner(args: t.PlaybackRunnerArgs): t.PlaybackRunner;

  /**
   * React hook binding a playback runner to component lifecycle.
   */
  useRunner(args: t.PlaybackRunnerArgs): t.PlaybackRunnerHook;

  /**
   * React hook: drives vTime progression (RAF) and pause-window materialization.
   * This is an integration helper; it does not own runner state transitions.
   */
  useClock(args: {
    runtime: t.PlaybackRuntime;
    getRunner: () => t.PlaybackRunner | undefined;
  }): void;

  /**
   * [Pure] Canonical projections (read-models).
   */
  readonly project: {
    readonly runnerState: (state: t.TimecodeState.Playback.State) => t.PlaybackRunnerState;
    readonly timeline: (state: t.TimecodeState.Playback.State) => t.PlaybackTimelineReadModel;
  };

  /**
   * [Pure] UI controllers (thin UI command shims).
   */
  readonly controller: {
    readonly timeline: (runner: t.PlaybackRunner) => t.TimelineController;
  };

  /**
   * [Imperative] Runtime adapters (imperative edge).
   */
  readonly runtime: {
    readonly noop: () => t.PlaybackRuntime;
    readonly fromVideoSignals: (args: t.VideoDeckRuntimeArgs) => t.PlaybackRuntime;
  };
};

/**
 * React-bound playback runner surface.
 */
export type PlaybackRunnerHook = {
  readonly snapshot: t.PlaybackRunnerState;
  readonly send: t.PlaybackRunner['send'];
};
