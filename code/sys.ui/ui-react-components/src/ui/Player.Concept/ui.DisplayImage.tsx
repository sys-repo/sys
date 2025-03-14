import React, { useEffect, useState } from 'react';
import { type t, Color, css, findTimestamp, Icons, Signal, Time } from './common.ts';

export type DisplayImageProps = {
  timestamps: t.VideoTimestamps;
  theme?: t.CommonTheme;
  style?: t.CssValue;
  videoSignals: t.VideoPlayerSignals;
};

type P = DisplayImageProps;

/**
 * Component.
 */
export const DisplayImage: React.FC<P> = (props) => {
  const { videoSignals: s, timestamps } = props;

  const [error, setError] = useState(false);
  const [src, setSrc] = useState<string>();
  const updateSrc = (value?: string) => {
    setSrc(value);
    setError(false);
  };

  /**
   * Lifecycle
   */
  Signal.useSignalEffect(() => {
    const elapsed = s.props.currentTime.value;
    const match = findTimestamp(timestamps, elapsed);
    if (match?.image !== src) Time.delay(() => updateSrc(match?.image));
  });

  useEffect(() => {
    if (src) {
      const image = new Image();
      image.src = src ?? '';
      image.onerror = () => setError(true);
    }
  }, [src]);

  /**
   * Render.
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg }),
    image: css({
      Absolute: 10,
      backgroundImage: src ? `url(${src})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }),
    error: css({ Absolute: 0, display: 'grid', placeItems: 'center' }),
  };

  const elError = error && (
    <div className={styles.error.class}>
      <Icons.Error color={Color.RED} />
    </div>
  );

  const tooltip = !error ? '' : `Failed to load image: ${src}`;

  return (
    <div className={css(styles.base, props.style).class} title={tooltip}>
      {src && <div className={styles.image.class} />}
      {elError}
    </div>
  );
};
