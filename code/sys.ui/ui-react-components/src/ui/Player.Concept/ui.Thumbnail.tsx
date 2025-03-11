import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, DEFAULTS, rx, Time } from './common.ts';

export type ThumbnailProps = {
  item: t.VideoTimestampItem;
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

export const Thumbnail: React.FC<ThumbnailProps> = (props) => {
  const { item } = props;
  const time = wrangle.time(item);
  const src = item.data.image;

  const [loaded, setLoaded] = useState(false);

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
      Size: [100, 80],
      display: 'grid',
      gridTemplateRows: `1fr auto`,
      rowGap: '3px',
      borderRadius,
      border: `solid 1px ${Color.alpha(theme.fg, 0.1)}`,
    }),
    image: css({
      Margin: [1, 1, 0, 1],
      position: 'relative',
      backgroundColor: Color.alpha(theme.fg, 0.03),
      backgroundImage: loaded ? `url(${src})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }),
    time: css({
      fontSize: 12,
      display: 'grid',
      placeItems: 'center',
      PaddingY: 3,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
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
