import React, { useEffect, useState } from 'react';

import { type t, Color, css, DEFAULTS, Icons, Signal, Time } from './common.ts';
import { Timestamp } from './u.ts';

export type ThumbnailProps = {
  timestamp: t.StringTimestamp;
  timestamps?: t.VideoTimestamps;
  data: t.VideoTimestampData;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onClick?: t.VideoTimestampHandler;
  videoSignals?: t.VideoPlayerSignals;
};

export const Thumbnail: React.FC<ThumbnailProps> = (props) => {
  const { timestamp, timestamps, data, onClick, videoSignals } = props;
  const time = wrangle.time(timestamp);
  const src = data.image;

  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isOver, setOver] = useState(false);
  const [isDown, setDown] = useState(false);
  const [isCurrent, setIsCurrent] = useState(false);
  const over = (isOver: boolean) => () => setOver(isOver);
  const down = (isDown: boolean) => () => setDown(isDown);

  /**
   * Lifecycle.
   */
  useEffect(() => {
    const image = new Image();
    image.src = src ?? '';
    image.onload = () => setLoaded(true);
    image.onerror = () => setError(true);
  }, [src]);

  /**
   * Highlight when current thumbnail/timestamp.
   */
  Signal.useSignalEffect(() => {
    const currentTime = videoSignals?.props.currentTime.value ?? -1;
    const set = (value: boolean) => Time.delay(() => setIsCurrent(value));
    if (timestamps) set(Timestamp.isCurrent(currentTime, timestamp, timestamps));
    else set(false);
  });

  /**
   * Handlers.
   */
  function handleClick() {
    const total = Timestamp.parseTime(timestamp);
    props.onClick?.({ timestamp, data, total });
  }

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const borderRadius = 6;
  const styles = {
    base: css({
      position: 'relative',
      userSelect: 'none',
      backgroundColor: Color.alpha(theme.fg, 0.03),
      color: theme.fg,
      width: 100,
      height: 80,
      display: 'grid',
      gridTemplateRows: `1fr auto`,
      borderRadius,
      border: `solid 1px ${Color.alpha(theme.fg, isOver && onClick ? 0.15 : 0.1)}`,
      boxShadow:
        isOver && onClick
          ? `0 1px ${isDown ? 4 : 15}px 0 ${Color.format(isDown ? -0.05 : -0.1)}`
          : undefined,
      transform: `translateY(${isDown ? 0 : -1}px)`,
    }),
    image: {
      base: css({
        position: 'relative',
        backgroundColor: theme.bg,
        borderRadius: `${borderRadius - 1}px ${borderRadius - 1}px 0 0`,
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
      }),
      img: css({
        Absolute: 0,
        backgroundImage: loaded ? `url(${src})` : undefined,
        display: 'grid',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }),
    },
    time: css({
      borderTop: `solid 1px ${Color.alpha(theme.fg, 0.1)}`,
      fontSize: 12,
      PaddingY: 1,
      display: 'grid',
      placeItems: 'center',
      backgroundColor: isCurrent ? DEFAULTS.BLUE : undefined,
      color: isCurrent ? Color.WHITE : undefined,
    }),
  };

  const tooltip = !error ? '' : `Failed to load image: ${src}`;

  return (
    <div
      className={css(styles.base, props.style).class}
      onMouseEnter={over(true)}
      onMouseLeave={over(false)}
      onMouseDown={down(true)}
      onMouseUp={down(false)}
      onClick={handleClick}
    >
      <div className={styles.image.base.class} title={tooltip}>
        {loaded && <div className={styles.image.img.class} />}
        {error && <Icons.Error color={Color.RED} />}
      </div>
      <div className={styles.time.class}>{time}</div>
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  time(ts: t.StringTimestamp) {
    return ts.slice(0, ts.indexOf('.'));
  },
} as const;
