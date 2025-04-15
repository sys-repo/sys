import React from 'react';
import { type t, Color, css, Icons, Spinners } from './common.ts';

export const ImageView: React.FC<t.ImageViewProps> = (props) => {
  const { src } = props;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  /**
   * Handlers:
   */
  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  /**
   * Effects:
   */
  React.useEffect(() => {
    setLoading(true);
    setError(false);
  }, [src]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
    image: {
      base: css({ display: 'grid', placeItems: 'center' }),
      element: css({
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
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
    error: {
      base: css({
        Absolute: 0,
        pointerEvents: 'none',
        opacity: error ? 1 : 0,
        transition: `opacity 400ms`,
        display: 'grid',
        placeItems: 'center',
      }),
      body: css({
        display: 'grid',
        placeItems: 'center',
        rowGap: '12px',
      }),
    },
  };

  const elImage = (
    <div className={styles.image.base.class}>
      <img
        className={styles.image.element.class}
        src={src}
        alt={props.alt}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );

  const elSpinner = loading && (
    <div className={styles.spinner.class}>
      <Spinners.Bar theme={props.theme} />
    </div>
  );

  const elError = error && (
    <div className={styles.error.base.class}>
      <div className={styles.error.body.class}>
        <Icons.Error size={38} />
        <div>{'( failed to load image )'}</div>
      </div>
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elImage}
      {elSpinner}
      {elError}
    </div>
  );
};
