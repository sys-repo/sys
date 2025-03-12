import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, rx, usePlayerEvents, VideoPlayer } from './common.ts';
import { findVideoTimestamp } from './u.ts';
import { Thumbnails } from './ui.Thumbnails.tsx';

/**
 * Component.
 */
export const ConceptPlayer: React.FC<t.ConceptPlayerProps> = (props) => {
  const timestamps = wrangle.timestamps(props);

  const playerEventsRef = useRef<t.UseVideoPlayerEvents>(usePlayerEvents());
  const playerEvents = playerEventsRef.current;
  const [imageSrc, setImageSrc] = useState<string>();

  /**
   * Lifecycle
   */
  useEffect(() => {
    const life = rx.lifecycle();
    const $ = playerEvents.playing$.pipe(rx.takeUntil(life.dispose$));
    $.subscribe((e) => {
      const match = findVideoTimestamp(timestamps, e.elapsed);
      setImageSrc(match?.image);
    });
    return life.dispose;
  }, [props.video, playerEvents, Object.keys(timestamps)]);

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg }),
    img: css({ marginTop: 30 }),
    thumbnails: css({ marginTop: 10 }),
  };

  const elThumbnails = props.thumbnails && (
    <Thumbnails
      style={styles.thumbnails}
      timestamps={timestamps}
      onTimestampClick={(e) => {
      }}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <VideoPlayer title={props.title} video={props.video} {...playerEvents.handlers} />
      {imageSrc && <img className={styles.img.class} src={imageSrc} />}
      {elThumbnails}
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  timestamps(props: t.ConceptPlayerProps) {
    const { timestamps } = props;
    if (typeof timestamps !== 'object') return {};
    return timestamps;
  },
} as const;
