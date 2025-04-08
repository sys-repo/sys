import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, DEFAULTS, rx, Sheet, Player, App } from '../ui.ts';

export type TrailerProps = t.ContentProps & {};

/**
 * Component:
 */
export const Trailer: React.FC<TrailerProps> = (props) => {
  const { index, state, content, breakpoint } = props;

  const player = App.Signals.Player.find(state, content, index);
  console.log('player', player);

  React.useEffect(() => {
    // player?.play();
  }, []);

  /**
   * Render:
   */
  const margin: t.SheetMarginInput = breakpoint.name === 'Desktop' ? ['1fr', 390, '1fr'] : 10;
  const styles = {
    base: css({ display: 'grid', gridTemplateRows: '1fr auto' }),
    children: css({ display: 'grid' }),
    player: css({ marginBottom: -1 }),
  };

  return (
    <Sheet {...props} theme={props.theme} edgeMargin={margin}>
      <div className={styles.base.class}>
        <div className={styles.children.class}>{'props.children 🐷'}</div>
        <Player.Video.View signals={player} style={styles.player} />
      </div>
    </Sheet>
  );
};
