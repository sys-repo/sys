import React from 'react';
import { type t, Color, css, D, usePlayerSignals, VideoElement } from './common.ts';

export const VideoDecks: React.FC<t.VideoDecksProps> = (props) => {
  const {
    debug = false,
    decks,
    active = D.active,
    aspectRatio = D.aspectRatio,
    muted = D.muted,
    show = D.show,
    gap = D.gap,
  } = props;

  const theme = Color.theme(props.theme);

  const ctlA = usePlayerSignals(decks?.A, { log: debug });
  const ctlB = usePlayerSignals(decks?.B, { log: debug });

  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      minWidth: 0,
      minHeight: 0,
    }),

    layoutBoth: css({
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr',
      gap,
      alignItems: 'stretch',
      justifyItems: 'stretch',
    }),

    layoutSingle: css({
      gridTemplateColumns: '1fr',
      gridTemplateRows: '1fr',
      alignItems: 'stretch',
      justifyItems: 'stretch',
    }),

    deck: css({
      display: 'grid',
      minWidth: 0,
      minHeight: 0,
    }),

    overlayCell: css({
      gridColumn: '1 / 2',
      gridRow: '1 / 2',
    }),
  } as const;

  function renderDeck(deckId: 'A' | 'B', ctl: ReturnType<typeof usePlayerSignals>) {
    const video = deckId === 'A' ? decks?.A : decks?.B;
    if (!video) return null;
    if (!ctl.props.src) return null;

    const isActive = active === deckId;
    const deckMuted = muted === false ? false : !isActive;

    const overlay: t.CssProps =
      show === 'single'
        ? {
            zIndex: isActive ? 2 : 1,
            opacity: isActive ? 1 : 0,
            pointerEvents: isActive ? 'auto' : 'none',
          }
        : {
            opacity: isActive ? 1 : 0.25,
            pointerEvents: isActive ? 'auto' : 'none',
          };

    const wrap = show === 'single' ? css(styles.deck, styles.overlayCell) : styles.deck;

    return (
      <div className={wrap.class} style={overlay}>
        <VideoElement
          {...ctl.props}
          debug={debug}
          theme={props.theme}
          interaction={{ clickToPlay: false }}
          aspectRatio={aspectRatio}
          muted={deckMuted}
        />
      </div>
    );
  }

  const layoutClass =
    show === 'single'
      ? css(styles.base, styles.layoutSingle, props.style).class
      : css(styles.base, styles.layoutBoth, props.style).class;

  return (
    <div className={layoutClass}>
      {renderDeck('A', ctlA)}
      {renderDeck('B', ctlB)}
    </div>
  );
};
