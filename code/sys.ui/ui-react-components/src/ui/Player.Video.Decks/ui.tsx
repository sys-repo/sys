import React from 'react';
import { type t, Color, css, D, usePlayerSignals, VideoElement } from './common.ts';

export const VideoDecks: React.FC<t.VideoDecksProps> = (props) => {
  const {
    debug = false,
    decks,
    active = D.active,
    aspectRatio = D.aspectRatio,
    muted = D.muted,
  } = props;

  const theme = Color.theme(props.theme);

  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
    row: css({
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      alignItems: 'start',
    }),
    deck: css({
      display: 'grid',
      minWidth: 0,
    }),
    inactive: css({
      opacity: 0.25,
      pointerEvents: 'none',
    }),
  } as const;

  const renderDeck = (deck: 'A' | 'B', video?: t.VideoPlayerSignals) => {
    const controller = usePlayerSignals(video, { log: debug });
    if (!video) return null;
    if (!controller.props.src) return null;

    const isActive = active === deck;
    const deckMuted = muted === false ? false : !isActive; // global mute policy → only active audible

    return (
      <div className={css(styles.deck, !isActive && styles.inactive).class}>
        <VideoElement
          {...controller.props}
          debug={debug}
          theme={props.theme}
          interaction={{ clickToPlay: false }}
          aspectRatio={aspectRatio}
          muted={deckMuted}
        />
      </div>
    );
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.row.class}>
        {renderDeck('A', decks?.A)}
        {renderDeck('B', decks?.B)}
      </div>
    </div>
  );
};
