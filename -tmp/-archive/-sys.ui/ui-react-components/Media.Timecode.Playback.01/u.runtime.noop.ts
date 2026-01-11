import { type t } from './common.ts';

/**
 * Create a no-op playback runtime.
 *
 * Purpose:
 * - Allows wiring the playback runner without real media decks (tests/dev/headless).
 *
 * Contract:
 * - Commands execute without throwing.
 * - No media side effects occur.
 *
 * Note:
 * - This is a null-object runtime; it intentionally does not provide real VideoPlayerSignals.
 */
export const noop: t.TimecodePlaybackLib['runtime']['noop'] = () => {
  const deck: t.PlaybackRuntime['deck'] = {
    play: (_deck) => {},
    pause: (_deck) => {},
    seek: (_deck, _vTime) => {},
  };

  const decks: t.VideoDeckRuntime = {
    A: undefined as unknown as t.VideoPlayerSignals,
    B: undefined as unknown as t.VideoPlayerSignals,
    get: (_deck) => undefined as unknown as t.VideoPlayerSignals,
    each: (_fn) => {},
  };

  return { deck, decks };
};
