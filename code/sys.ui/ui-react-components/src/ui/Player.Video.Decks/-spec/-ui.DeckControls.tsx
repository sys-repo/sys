import React from 'react';
import { type t, PlayerControls } from '../common.ts';
import { useDecksControls } from '../use.DecksControls.tsx';

export type DeckControlsProps = {
  decks: t.VideoDecks;
  active?: t.VideoDecksActive;
  theme?: t.CommonTheme;
  padding?: t.CssEdgesInput;
  margin?: t.CssEdgesInput;
};

/**
 * Controls wired to the active deck.
 */
export const DeckControls: React.FC<DeckControlsProps> = (props) => {
  const { decks, theme, active = 'A' } = props;
  const deck = decks[active];
  const p = deck.props;
  const ctrl = useDecksControls({ decks, active });

  return (
    <PlayerControls.UI
      theme={theme}
      playing={p.playing.value}
      muted={p.muted.value}
      currentTime={ctrl.currentTime}
      duration={p.duration.value}
      buffering={p.buffering.value}
      onClick={ctrl.handleClick}
      onSeeking={ctrl.handleSeeking}
      maskOpacity={0}
      background={{ rounded: 6, opacity: 0.4, shadow: false }}
      padding={props.padding}
      margin={props.margin}
    />
  );
};
