import type { t } from './common.ts';

/**
 * Runner loop contract (internal).
 *
 * Purpose:
 * - Reduce inputs through the pure machine.
 * - Publish reducer events (observational; no feedback).
 * - Execute emitted cmds against the runtime.
 * - Publish derived read-model snapshots.
 *
 * Law: for a single `send(input)` flush, delivery order is:
 *   1) events (in reducer order)
 *   2) cmds   (in reducer order)
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
 * Executes a reducer command against the runtime.
 * Kept injectable for testing (spy / record / assert order).
 */
export type PlaybackCmdExecutor = (cmd: t.TimecodeState.Playback.Cmd) => void;

/**
 * Optional hook for observing reducer events (debug/log/telemetry).
 * Events do NOT feed back into the machine.
 */
export type PlaybackEventSink = (e: t.TimecodeState.Playback.Event) => void;

/**
 * Minimal dependencies required to run the loop.
 */
export type PlaybackRunnerLoopDeps = {
  readonly machine: t.TimecodePlaybackLib;
  readonly runtime: t.PlaybackRuntime;

  /** Deterministic projector for public read-model. */
  readonly project: PlaybackProjector;

  /** Execute a cmd against the runtime (single seam). */
  readonly exec: PlaybackCmdExecutor;

  /** Optional: observe machine events as they are emitted. */
  readonly onEvent?: PlaybackEventSink;

  /** Optional: observe cmd stream as it is executed (debug/testing). */
  readonly onCmd?: (cmd: t.TimecodeState.Playback.Cmd) => void;
};

/**
 * Internal runner loop surface.
 *
 * Note: this is intentionally close to the eventual implementation surface:
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
