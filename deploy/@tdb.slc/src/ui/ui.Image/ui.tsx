import React, { useEffect, useState } from 'react';
import { type t, Color, css, Is, Spinners } from './common.ts';
import { ErrorMessage } from './ui.Error.tsx';

type P = t.ImageViewProps;

export const ImageView: React.FC<P> = (props) => {
  const { debug = false } = props;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [src, setSrc] = useState<string>();

  /**
   * Handlers:
   */
  const handleLoad = () => setLoading(false);
  const handleError = () => {
    console.warn('Error while loading image:', src);
    setLoading(false);
    setError(true);
  };

  /**
   * Effects:
   */
  useEffect(() => {
    wrangle.src(props.src, setSrc);
  }, [props.src]);

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [src]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      backgroundColor: Color.ruby(debug),
    }),
    img: css({
      Absolute: [-99999, null, null, -99999],
      opacity: 0,
      pointerEvents: 'none',
    }),
    display: {
      base: css({ Absolute: props.padding, display: 'grid' }),
      img: css({
        backgroundImage: src ? `url(${src})` : undefined,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'contain',
        opacity: loading || error ? 0 : 1,
        transition: `opacity 400ms`,
      }),
    },
    spinner: css({
      Absolute: 0,
      display: 'grid',
      placeItems: 'center',
      pointerEvents: 'none',
    }),
    error: css({
      Absolute: 0,
      pointerEvents: 'none',
      opacity: error ? 1 : 0,
      transition: `opacity 400ms`,
    }),
  };

  const elImg = (
    <img className={styles.img.class} src={src} onLoad={handleLoad} onError={handleError} />
  );

  const elDisplayImage = (
    <div className={styles.display.base.class}>
      <div className={styles.display.img.class} />
    </div>
  );

  const elSpinner = loading && (
    <div className={styles.spinner.class}>
      <Spinners.Bar theme={props.theme} />
    </div>
  );

  const elError = error && <ErrorMessage src={src} theme={theme.name} style={styles.error} />;

  return (
    <div className={css(styles.base, props.style).class}>
      {elImg}
      {elDisplayImage}
      {elSpinner}
      {elError}
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  async src(value: P['src'], setState: (value?: string) => void) {
    setState(Is.promise(value) ? await value : value);
  },
} as const;
