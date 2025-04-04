import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, DEFAULTS, rx, Sheet, Player, AppSignals } from '../ui.ts';

export type TrailerProps = t.ContentProps & {};

/**
 * Component:
 */
export const Trailer: React.FC<TrailerProps> = (props) => {
  const { index, state, content } = props;

  const player = AppSignals.Player.find(state, content, index);
  console.log('player', player);

  React.useEffect(() => {
    // player?.play();
  }, []);

  /**
   * Render:
   */
  const styles = {
    base: css({ display: 'grid', gridTemplateRows: '1fr auto' }),
    children: css({ display: 'grid' }),
    player: css({ marginBottom: -1 }),
  };

  return (
    <Sheet {...props} theme={props.theme} margin={10}>
      <div className={styles.base.class}>
        <div className={styles.children.class}>{props.children}</div>
        <Player.Video.View signals={player} style={styles.player} />
      </div>
    </Sheet>
  );
};
