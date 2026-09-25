import React from 'react';
import { type t, Signal, PlayerControls } from './common.ts';

export const useDecksControls: t.UseVideoDecksControls = (props) => {
  const { decks } = props;
  const active = props.active ?? 'A';
  const deck = decks[active];
  const p = deck.props;
  Signal.useRedrawEffect(() => Signal.listen(p, true));

  /**
   * Active-deck switch behavior (debug only):
   * - if the previous deck was playing, pause it
   * - start the newly active deck
   * - optionally sync time so the swap feels continuous
   */
  React.useEffect(() => {
    const next = active;
    const prev = next === 'A' ? 'B' : 'A';

    const nextDeck = decks[next];
    const prevDeck = decks[prev];
    const wasPlaying = prevDeck.is.playing;

    // Sync time (optional, but makes the swap feel sane).
    const t = prevDeck.props.currentTime.value ?? 0;
    if (t > 0) nextDeck.jumpTo(t);

    // Stop the other one.
    if (wasPlaying) {
      prevDeck.pause();
      nextDeck.play();
    }
  }, [active, decks]);

  const seek = PlayerControls.usePendingSeek(p.currentTime.value ?? 0, [active]);

  const handleClick: t.PlayerControlsButtonHandler = (e) => {
    if (e.button === 'Play') deck.is.playing ? deck.pause() : deck.play();
    if (e.button === 'Mute') p.muted.value = !p.muted.value;
  };

  const handleSeeking: t.PlayerControlSeekChangeHandler = (e) => {
    if (e.complete) {
      seek.setPendingSeek(e.currentTime);
      deck.jumpTo(e.currentTime);
    }
  };

  return {
    currentTime: seek.currentTime,
    handleClick,
    handleSeeking,
  } as const;
};
