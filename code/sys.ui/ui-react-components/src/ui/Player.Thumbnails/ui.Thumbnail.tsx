import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Icons, Signal, Time } from './common.ts';
import { Timestamp } from './u.ts';
import { FooterBar } from './ui.Thumbnail.FooterBar.tsx';

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
  const src = data.image;

  const rangeRef = useRef(Timestamp.range(timestamps, timestamp));
  const range = rangeRef.current;

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
  Signal.useEffect(() => {
    const currentTime = videoSignals?.props.currentTime.value ?? -1;
    const update = (isCurrent: boolean) => {
      // NB: state updated after a micro-delay to ensure writing happens on the next render frame.
      Time.delay(() => setIsCurrent(isCurrent));
    };

    if (timestamps) {
      const isCurrent = Timestamp.isCurrent(timestamps, timestamp, currentTime);
      update(isCurrent);
    } else {
      update(false);
    }
  });

  /**
   * Handlers.
   */
  function handleClick() {
    const total = Timestamp.parseTime(timestamp);
    props.onClick?.({ timestamp, data, total, isCurrent });
  }

  /**
   * Render:.
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
  };

  const tooltip = !error ? '' : `Failed to load image: ${src}`;
  const elBody = (
    <div className={styles.image.base.class} title={tooltip}>
      {loaded && <div className={styles.image.img.class} />}
      {error && <Icons.Error color={Color.RED} />}
    </div>
  );

  const elFooter = (
    <FooterBar
      timestamp={timestamp}
      timestamps={timestamps}
      isCurrent={isCurrent}
      theme={theme.name}
    />
  );

  return (
    <div
      className={css(styles.base, props.style).class}
      onMouseEnter={over(true)}
      onMouseLeave={over(false)}
      onMouseDown={down(true)}
      onMouseUp={down(false)}
      onClick={handleClick}
    >
      {elBody}
      {elFooter}
    </div>
  );
};
