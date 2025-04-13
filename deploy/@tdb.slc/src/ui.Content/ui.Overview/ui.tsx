import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, DEFAULTS, rx, Sheet, Player, App, Time } from '../common.ts';
import { PullDown } from './ui.PullDown.tsx';
import { ElapsedTime, useTimestamps } from '../ui/mod.ts';

export type OverviewProps = t.VideoContentProps;

/**
 * Component:
 */
export const Overview: React.FC<OverviewProps> = (props) => {
  const { index, state, content } = props;
  const { showElapsed = true } = content;

  const player = content.video;
  const timestamp = useTimestamps(props, player);

  /**
   * Effect: Play on load.
   */
  React.useEffect(() => {
    if (content.playOnLoad) player?.play();
  }, [player]);


  /**
   * Render:
   */
  const edge: t.SheetMarginInput = state.breakpoint.name === 'Desktop' ? ['1fr', 390, '1fr'] : 10;
  const styles = {
    base: css({ marginTop: 44 }),
    body: css({ position: 'relative', display: 'grid', gridTemplateRows: '1fr auto' }),
    content: css({ display: 'grid' }),
    player: css({ marginBottom: -1 }),
  };

  return (
    <Sheet
      {...props}
      theme={props.theme}
      style={styles.base}
      edgeMargin={edge}
      orientation={'Bottom:Up'}
    >
      <div className={styles.body.class}>
        <div className={styles.content.class}>{timestamp.content}</div>
        <Player.Video.View signals={player} style={styles.player} />
      </div>
      <ElapsedTime player={player} abs={[6, 6, null, null]} show={showElapsed} />
    </Sheet>
  );
};
