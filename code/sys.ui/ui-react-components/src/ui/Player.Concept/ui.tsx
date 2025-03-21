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

  const [showOverlay, setShowOverlay] = useState<boolean>(false);

  /**
   * Render:
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
      videoSignals={props.videoSignals}
      onTimestampClick={(e) => {
        const isPlaying = playerSignals.props.playing.value;
        const target = e.total.sec;
        if (e.isCurrent) {
          playerSignals.toggle(!isPlaying);
        } else {
          playerSignals.jumpTo(target);
        }
      }}
    />
  );

  const elPlayer = (
    <VideoPlayer title={props.title} style={styles.videoPlayer} signals={playerSignals} />
  );

  const elTmp = (
    <div className={styles.tmp.class}>
      <Button
        label={'🐷 Full Screen Concept Player'}
        onClick={() => {
          /**
           * TODO 🐷
           */
          setShowOverlay(true);
        }}
      />
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        {elPlayer}
        <DisplayImage timestamps={timestamps} videoSignals={playerSignals} />
      </div>
      {elThumbnails}

      {elTmp}
      {showOverlay && <Overlay ctx={props} onClose={() => setShowOverlay(false)} />}
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
