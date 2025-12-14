import type { t } from './common.ts';

/**
 * A/B deck wrapper over two VideoPlayerSignals instances.
 *
 * - This is a *runtime* contract (signals + helpers), not UI-state.
 * - The adapter owns the conversion boundary (secs ⇄ msecs) elsewhere.
 */
export type VideoDeckRuntime = {
  readonly A: t.VideoPlayerSignals;
  readonly B: t.VideoPlayerSignals;

  /**
   * Safe accessor by machine deck id.
   */
  get(deck: t.TimecodeState.Playback.DeckId): t.VideoPlayerSignals;

  /**
   * Iterate in a stable A,B order (handy for wiring/unwiring).
   */
  each(
    fn: (e: {
      readonly deck: t.TimecodeState.Playback.DeckId;
      readonly signals: t.VideoPlayerSignals;
    }) => void,
  ): void;
};

/**
 * Minimal imperative deck controls the runner can execute.
 *
 * NOTE:
 * - `seek` is optional because some runtimes might only support `jumpTo`.
 * - The adapter decides what "seek" means and how to implement it.
 */
export type VideoDeckControlRuntime = {
  play(deck: t.TimecodeState.Playback.DeckId): void;
  pause(deck: t.TimecodeState.Playback.DeckId): void;
  seek?(deck: t.TimecodeState.Playback.DeckId, vTime: t.Msecs): void;
};

/**
 * Construction args for creating a VideoDeckRuntime from two signals.
 */
export type VideoDeckRuntimeArgs = {
  readonly A: t.VideoPlayerSignals;
  readonly B: t.VideoPlayerSignals;
};

/**
 * Mapping between virtual time (machine) and player time (signals).
 *
 * Default is a 1:1 mapping (vTime msecs ⇄ secs). If you later add
 * composition-aware mapping, provide an implementation here without
 * changing the runner/machine.
 */
export type VideoDeckTimeMapper = {
  toPlayerSecs(e: {
    readonly deck: t.TimecodeState.Playback.DeckId;
    readonly vTime: t.Msecs;
  }): t.Secs;
};
