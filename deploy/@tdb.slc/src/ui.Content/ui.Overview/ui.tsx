import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, DEFAULTS, rx, Sheet, Player, App } from '../ui.ts';

export type OverviewProps = t.ContentProps & {};

/**
 * Component:
 */
export const Overview: React.FC<OverviewProps> = (props) => {
  const { index, state, content } = props;

  const player = App.Signals.Player.find(state, content, index);
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
  };

  return (
    <Sheet {...props} theme={props.theme} edgeMargin={0} orientation="Top:Down">
      <div className={styles.base.class}>
        <div className={styles.children.class}>{'props.children 🐷'}</div>
        <Player.Video.View signals={player} />
      </div>
    </Sheet>
  );
};
