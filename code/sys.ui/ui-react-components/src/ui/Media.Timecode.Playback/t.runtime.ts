import type { t } from './common.ts';

/**
 * Runtime inputs fed into the playback state machine.
 *
 * External observations only (media time, readiness, buffering).
 */
export type PlaybackRunnerInput = t.TimecodeState.Playback.Input;

/**
 * Minimal runtime capabilities required to execute
 * reducer-issued commands.
 *
 * Abstracts over <video>, audio, or any media backend.
 */
export type PlaybackRuntime = {
  /**
   * Minimal imperative controls used by the runner.
   * (Pure deck contract lives in `t.deck.ts`.)
   */
  readonly deck: t.VideoDeckControlRuntime;

  /**
   * Optional A/B deck signals bundle (used by higher adapters).
   * The runner itself can remain signal-agnostic.
   */
  readonly decks?: t.VideoDeckRuntime;
};

/**
 * Observable playback state exposed to the UI.
 *
 * Read-model derived from reducer state.
 */
export type PlaybackRunnerState = {
  readonly state: t.TimecodeState.Playback.State;
  readonly phase: t.TimecodeState.Playback.Phase;
  readonly intent: t.TimecodeState.Playback.Intent;
  readonly currentBeat?: t.TimecodeState.Playback.BeatIndex;
  readonly decks: t.TimecodeState.Playback.State['decks'];
};

/**
 * Public handle for a running playback adapter.
 */
export type PlaybackRunner = {
  send(input: t.PlaybackRunnerInput): void;
  get(): t.PlaybackRunnerState;
  subscribe(fn: (state: t.PlaybackRunnerState) => void): () => void;
  dispose(): void;
};

/**
 * Construction arguments for a playback runner.
 */
export type PlaybackRunnerArgs = {
  readonly initial?: t.TimecodeState.Playback.State;
  readonly runtime: t.PlaybackRuntime;

  /**
   * Optional injection seam (testing / advanced hosting).
   * Must match the ui-state machine surface used by the runner (init/reduce).
   * Default: TimecodeState.Playback
   */
  readonly machine?: t.TimecodeState.Playback.Lib;

  /**
   * Optional event observer (debug/testing).
   * Law: events are delivered before cmds for a single send() flush.
   */
  readonly onEvent?: (e: t.TimecodeState.Playback.Event) => void;

  /**
   * Optional cmd observer (debug/testing).
   * Observes cmds as they are about to be executed.
   */
  readonly onCmd?: (cmd: t.TimecodeState.Playback.Cmd) => void;
};
