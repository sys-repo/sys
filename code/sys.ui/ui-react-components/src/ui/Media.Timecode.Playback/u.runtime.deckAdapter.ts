import type { t } from './common.ts';
import { Convert } from './u.convert.ts';

/**
 * Create a stable A/B deck runtime over two VideoPlayerSignals.
 */
export function createVideoDeckRuntime(args: t.VideoDeckRuntimeArgs): t.VideoDeckRuntime {
  const { A, B } = args;

  const get = (deck: t.TimecodeState.Playback.DeckId): t.VideoPlayerSignals => {
    return deck === 'A' ? A : B;
  };

  const each: t.VideoDeckRuntime['each'] = (fn) => {
    fn({ deck: 'A', signals: A });
    fn({ deck: 'B', signals: B });
  };

  return { A, B, get, each };
}

export const DeckTime: Readonly<{ defaultMapper: t.VideoDeckTimeMapper }> = {
  defaultMapper: {
    toPlayerSecs: (e) => Convert.toSecs(e.vTime),
  },
} as const;

/**
 * Create a PlaybackRuntime backed by VideoPlayerSignals decks.
 *
 * This is the runner-facing imperative surface:
 * reducer cmds → play/pause/seek → signals mutations.
 */
export function createPlaybackRuntimeFromDecks(
  decks: t.VideoDeckRuntime,
  mapper: t.VideoDeckTimeMapper = DeckTime.defaultMapper,
): t.PlaybackRuntime {
  const deck: t.PlaybackRuntime['deck'] = {
    play(deckId) {
      decks.get(deckId).play();
    },

    pause(deckId) {
      decks.get(deckId).pause();
    },

    seek(deckId, vTime) {
      const second = mapper.toPlayerSecs({ deck: deckId, vTime });
      // Seek without forcing play; machine controls intent separately.
      decks.get(deckId).jumpTo(second, { play: false });
    },
  };

  return { deck, decks };
}
