import type { t } from './common.ts';
import { Convert } from './u.convert.ts';

/**
 * Canonical default virtual-time → player-seconds mapper.
 */
export const DeckTime: t.VideoDeckTimeLib = {
  defaultMapper: {
    toPlayerSecs: ({ vTime }) => Convert.toSecs(Math.max(0, vTime)),
  },
};

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
      const s = decks.get(deckId);
      const rawSecond = mapper.toPlayerSecs({ deck: deckId, vTime });

      // Clamp to known duration when available to avoid "black near end" seeks.
      const dur = s.props.duration.value;
      const hasDur = Number.isFinite(dur) && dur > 0;
      const END_EPS_SECS = 0.25;
      const max = hasDur ? Math.max(0, dur - END_EPS_SECS) : Infinity;
      const second = Math.min(Math.max(0, rawSecond), max);

      /** Seek without forcing play; machine controls intent separately. */
      s.jumpTo(second, { play: false });
    },
  };

  return { deck, decks };
}
