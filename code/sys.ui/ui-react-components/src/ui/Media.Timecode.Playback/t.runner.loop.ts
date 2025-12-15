import type { t } from './common.ts';

/**
 * Runner loop contract (internal).
 *
 * Purpose:
 * - Reduce inputs through the pure machine.
 * - Publish reducer events (observational only).
 * - Execute emitted cmds against the runtime.
 * - Publish derived read-model snapshots.
 *
 * No scheduling policy is implied here (raf, timeupdate, setInterval, etc).
 * The loop only accepts inputs; adapters decide when to send them.
 */

/**
 * Projects machine state into the public runner read-model.
 * Keep stable + small so UI subscriptions are cheap.
 */
export type PlaybackProjector = (state: t.TimecodeState.Playback.State) => t.PlaybackRunnerState;

/**
 * Optional hook for observing reducer events (debug/log/telemetry).
 * Events do NOT feed back into the machine.
 */
export type PlaybackEventSink = (e: t.TimecodeState.Playback.Event) => void;

/**
 * Minimal dependencies required to run the loop.
 *
 * Note: cmd execution is performed internally from `runtime.deck`.
 * Use `onCmd` only as an observation seam (ordering/assertions).
 */
export type PlaybackRunnerLoopDeps = {
  /** Playback machine contract (init + reduce). Defaults to TimecodeState.Playback. */
  readonly machine?: t.TimecodeState.Playback.Lib;

  /** Imperative runtime surface for reducer-issued cmds. */
  readonly runtime: t.PlaybackRuntime;

  /** Deterministic projector for public read-model. */
  readonly project: PlaybackProjector;

  /** Optional: observe machine events as they are emitted. */
  readonly onEvent?: PlaybackEventSink;

  /** Optional: observe cmd stream as it is about to be executed. */
  readonly onCmd?: (cmd: t.TimecodeState.Playback.Cmd) => void;
};

/**
 * Internal runner loop surface.
 *
 * - send input (action/signal)
 * - read current projected state
 * - subscribe to projected state changes
 * - dispose
 */
export type PlaybackRunnerLoop = {
  send(input: t.PlaybackRunnerInput): void;
  get(): t.PlaybackRunnerState;
  subscribe(fn: (state: t.PlaybackRunnerState) => void): () => void;
  dispose(): void;
};
