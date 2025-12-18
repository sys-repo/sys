import type { t } from './common.ts';

type DeckId = t.TimecodeState.Playback.DeckId;

/**
 * Video deck time mapping library surface.
 *
 * Semantics (defaultMapper):
 * - vTime is global virtual timeline time (pause-inflated).
 * - Clamp to 0.
 * - Convert msecs → secs.
 *
 * Notes:
 * - The default ignores deck identity and segment base. Runtimes that require
 *   deck-local mapping should supply a custom mapper.
 */
export type VideoDeckTimeLib = {
  readonly defaultMapper: t.VideoDeckTimeMapper;
};

/**
 * A/B deck wrapper over two VideoPlayerSignals instances.
 *
 * - This is a *runtime* contract (signals + helpers), not UI-state.
 * - The adapter owns the conversion boundary (secs ⇄ msecs) elsewhere.
 */
export type VideoDeckRuntime = {
  readonly A: t.VideoPlayerSignals;
  readonly B: t.VideoPlayerSignals;

  /** Safe accessor by machine deck id. */
  get(deck: DeckId): t.VideoPlayerSignals;

  /** Iterate in a stable A,B order (handy for wiring/unwiring). */
  each(fn: (e: VideoDeckBinding) => void): void;
};

/** Live association between a playback deck id and its bound player signals. */
export type VideoDeckBinding = {
  readonly deck: DeckId;
  readonly signals: t.VideoPlayerSignals;
};

/**
 * Minimal imperative deck controls the runner can execute.
 *
 * NOTE:
 * - `seek` is optional because some runtimes might only support `jumpTo`.
 * - The adapter decides what "seek" means and how to implement it.
 */
export type VideoDeckControlRuntime = {
  play(deck: DeckId): void;
  pause(deck: DeckId): void;
  seek?(deck: DeckId, vTime: t.Msecs): void;
};

/**
 * Construction args for creating a VideoDeckRuntime from two signals.
 */
export type VideoDeckRuntimeArgs = {
  readonly A: t.VideoPlayerSignals;
  readonly B: t.VideoPlayerSignals;
};

/**
 * Maps playback-machine time (virtual milliseconds) into the media player's
 * time domain (seconds).
 *
 * This is the single boundary where "virtual timeline" semantics become
 * concrete seeks on a specific deck.
 *
 * Consumers:
 * - The playback machine remains purely in virtual time.
 * - The runtime adapter uses this mapper to execute deck seeks.
 *
 * Contract:
 * - Pure and deterministic (no IO, no reliance on mutable state).
 * - Must produce a non-negative seconds value.
 */
export type VideoDeckTimeMapper = {
  toPlayerSecs(e: { deck: DeckId; vTime: t.Msecs }): number;
};
