import React from 'react';
import { type t, Color, css, D, usePlayerSignals, VideoElement } from './common.ts';

export type DeckVideoProps = {
  deck: t.VideoDecksActive;
  parent: t.VideoDecksProps;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const DeckVideo: React.FC<DeckVideoProps> = (props) => {
  const { parent } = props;
  const {
    debug = false,
    decks,
    active = D.active,
    aspectRatio = D.aspectRatio,
    muted,
    show = D.show,
  } = parent;

  const video = props.deck === 'A' ? decks?.A : decks?.B;
  const isActive = active === props.deck;
  const ctl = usePlayerSignals(video, { log: debug });
  const deckMuted = muted === undefined ? ctl.props.muted : muted;

  if (!video) return null;
  if (!ctl.props.src) return null;

  /**
   * Render:
   */
  const theme = Color.theme(parent.theme);
  const styles = {
    base: css({
      display: 'grid',
      minWidth: 0,
      minHeight: 0,
    }),
    overlayCell: css({ gridColumn: '1 / 2', gridRow: '1 / 2' }),
  };

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

  const base = show === 'single' ? css(styles.base, styles.overlayCell) : styles.base;

  return (
    <div className={css(base, props.style).class} style={overlay}>
      <VideoElement
        {...ctl.props}
        debug={debug}
        theme={theme.name}
        interaction={{ clickToPlay: false }}
        aspectRatio={aspectRatio}
        muted={deckMuted}
      />
    </div>
  );
};
