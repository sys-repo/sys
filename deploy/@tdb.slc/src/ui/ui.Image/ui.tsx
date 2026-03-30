import React, { useEffect, useState } from 'react';
import { type t, Color, css, Is, Spinners } from './common.ts';
import { ErrorMessage } from './ui.Error.tsx';

type P = t.ImageViewProps;

export const ImageView: React.FC<P> = (props) => {
  const { debug = false } = props;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [src, setSrc] = useState<string>();
  const imageSrc = src ? wrangle.resolveUrl(src) : undefined;

  /**
   * Handlers:
   */
  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };
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
    if (!src) {
      setLoading(false);
      setError(false);
      return;
    }

    const global = globalThis as typeof globalThis & { Image?: typeof Image };
    const ImageCtor = global.Image;
    if (!ImageCtor) {
      setLoading(false);
      return;
    }

    let disposed = false;
    const img = new ImageCtor();
    const resolved = wrangle.resolveUrl(src);

    setLoading(true);
    setError(false);

    img.onload = () => {
      if (disposed) return;
      handleLoad();
    };
    img.onerror = () => {
      if (disposed) return;
      handleError();
    };
    img.src = resolved;

    // NB: Cached images may already be complete by the time handlers are attached.
    if (img.complete) {
      if (img.naturalWidth > 0) handleLoad();
      else handleError();
    }

    return () => {
      disposed = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      position: 'relative',
      display: 'grid',
      backgroundColor: Color.ruby(debug),
    }),
    display: {
      base: css({ Absolute: props.padding ?? 0, display: 'grid' }),
      img: css({
        Absolute: 0,
        backgroundImage: imageSrc ? `url(${imageSrc})` : undefined,
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

  const elError = error && <ErrorMessage src={imageSrc} theme={theme.name} style={styles.error} />;

  return (
    <div className={css(styles.base, props.style).class}>
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
  resolveUrl(value: string) {
    if (!globalThis.document) return value;
    try {
      return new URL(value, document.baseURI).href;
    } catch {
      return value;
    }
  },
} as const;
