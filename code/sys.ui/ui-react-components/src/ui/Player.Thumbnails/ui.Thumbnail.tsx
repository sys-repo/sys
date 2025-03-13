import React, { useEffect, useState } from 'react';
import { type t, Color, css } from './common.ts';

export type ThumbnailProps = {
  item: t.VideoTimestampItem;
  theme?: t.CommonTheme;
  style?: t.CssValue;
  onClick?: t.VideoTimestampHandler;
};

export const Thumbnail: React.FC<ThumbnailProps> = (props) => {
  const { item, onClick } = props;
  const { timestamp, data } = item;
  const time = wrangle.time(item);
  const src = item.data.image;

  const [loaded, setLoaded] = useState(false);
  const [isOver, setOver] = useState(false);
  const [isDown, setDown] = useState(false);
  const over = (isOver: boolean) => () => setOver(isOver);
  const down = (isDown: boolean) => () => setDown(isDown);

  useEffect(() => {
    const image = new Image();
    image.src = src ?? '';
    image.onload = () => setLoaded(true);
  }, [src]);

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const borderRadius = 6;

  const styles = {
    base: css({
      backgroundColor: Color.alpha(theme.fg, 0.03),
      color: theme.fg,
      width: 100,
      height: 80,
      display: 'grid',
      gridTemplateRows: `1fr auto`,
      rowGap: '3px',
      borderRadius,
      border: `solid 1px ${Color.alpha(theme.fg, isOver && onClick ? 0.15 : 0.1)}`,
      boxShadow:
        isOver && onClick
          ? `0 1px ${isDown ? 4 : 15}px 0 ${Color.format(isDown ? -0.05 : -0.1)}`
          : undefined,
      transform: `translateY(${isDown ? 0 : -1}px)`,
      userSelect: 'none',
    }),
    image: css({
      Margin: [1, 1, 0, 1],
      position: 'relative',
      backgroundColor: theme.bg,
      backgroundImage: loaded ? `url(${src})` : undefined,
      display: 'grid',
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }),
    time: css({
      borderTop: `solid 1px ${Color.alpha(theme.fg, 0.1)}`,
      fontSize: 12,
      display: 'grid',
      placeItems: 'center',
      PaddingY: 1,
    }),
  };

  return (
    <div
      className={css(styles.base, props.style).class}
      onMouseEnter={over(true)}
      onMouseLeave={over(false)}
      onMouseDown={down(true)}
      onMouseUp={down(false)}
      onClick={() => props.onClick?.({ timestamp, data })}
    >
      <div className={styles.image.class}></div>
      <div className={styles.time.class}>{time}</div>
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  time(item: t.VideoTimestampItem) {
    const ts = item.timestamp;
    const index = ts.indexOf('.');
    return ts.slice(0, index);
  },
} as const;
