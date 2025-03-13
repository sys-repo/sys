import React, { useEffect, useRef, useState } from 'react';
import {
  Color,
  css,
  findTimestamp,
  playerSignalsFactory,
  rx,
  Thumbnails,
  usePlayerEvents,
  VideoPlayer,
  type t,
} from './common.ts';

type P = t.ConceptPlayerProps;

/**
 * Component.
 */
export const ConceptPlayer: React.FC<P> = (props) => {
  const timestamps = wrangle.timestamps(props);

  const playerEventsRef = useRef<t.UseVideoPlayerEvents>(usePlayerEvents());
  const playerSignalsRef = wrangle.playerSignals(props);

  const playerEvents = playerEventsRef.current;
  const playerSignals = playerSignalsRef.current;

  const [imageSrc, setImageSrc] = useState<string>();

  /**
   * Lifecycle
   */
  useEffect(() => {
    const life = rx.lifecycle();
    const $ = playerEvents.playing$.pipe(rx.takeUntil(life.dispose$));
    $.subscribe((e) => {
      const match = findTimestamp(timestamps, e.elapsed);
      setImageSrc(match?.image);
    });
    return life.dispose;
  }, [props.video, playerEvents, Object.keys(timestamps)]);

  /**
   * Render.
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
    }),
    body: css({
      display: 'grid',
      gridTemplateColumns: `1fr 1fr`,
      placeItems: 'center',
    }),
    videoPlayer: css({
      width: 350,
    }),
    img: css({ marginTop: 30 }),
    thumbnails: css({ marginTop: 10 }),
  };

  const elThumbnails = props.thumbnails && (
    <Thumbnails
      style={styles.thumbnails}
      timestamps={timestamps}
      onTimestampClick={(e) => playerSignals?.jumpTo(e.total.secs)}
    />
  );

  const elPlayer = (
    <VideoPlayer
      title={props.title}
      video={props.video}
      style={styles.videoPlayer}
      {...playerEvents.handlers}
      signals={playerSignals}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        {elPlayer}
        {imageSrc && <img className={styles.img.class} src={imageSrc} />}
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
