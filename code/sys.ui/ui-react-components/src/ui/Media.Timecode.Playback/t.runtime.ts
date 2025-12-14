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
  readonly deck: {
    play(deck: t.TimecodeState.Playback.DeckId): void;
    pause(deck: t.TimecodeState.Playback.DeckId): void;
    seek?(deck: t.TimecodeState.Playback.DeckId, vTime: t.Msecs): void;
  };
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
};
