import React, { useRef, useState } from 'react';
import { Overlay } from './-tmp.tsx';
import {
  type t,
  Button,
  Color,
  css,
  playerSignalsFactory,
  Thumbnails,
  VideoPlayer,
} from './common.ts';
import { DisplayImage } from './ui.DisplayImage.tsx';

type P = t.ConceptPlayerProps;

/**
 * Component
 */
export const ConceptPlayer: React.FC<P> = (props) => {
  const timestamps = wrangle.timestamps(props);
  const playerSignalsRef = wrangle.playerSignals(props);
  const playerSignals = playerSignalsRef.current;

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, fontSize: 14 }),
    body: css({ display: 'grid', gridTemplateColumns: `1fr 2fr`, columnGap: '5px' }),
    videoPlayer: css({}),
    thumbnails: css({ marginTop: 30 }),

    tmp: css({
      marginTop: 50,
    }),
  };

  const elThumbnails = props.thumbnails && (
    <Thumbnails
      style={styles.thumbnails}
      timestamps={timestamps}
      onTimestampClick={(e) => {
        console.log('playerSignals', playerSignals);
        console.log('jump to', e.total);
        playerSignals?.jumpTo(e.total.secs);
      }}
    />
  );

  const elPlayer = (
    <VideoPlayer
      title={props.title}
      video={props.video}
      style={styles.videoPlayer}
      signals={playerSignals}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        {elPlayer}
        <DisplayImage timestamps={timestamps} videoSignals={playerSignals} />
      </div>
      {elThumbnails}
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  timestamps(props: P) {
    const { timestamps } = props;
    if (typeof timestamps !== 'object') return {};
    return timestamps;
  },

  playerSignals(props: P) {
    type T = t.VideoPlayerSignals;
    return useRef<T>(props.videoSignals ?? playerSignalsFactory());
  },
} as const;
