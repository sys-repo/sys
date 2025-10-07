import React, { useEffect, useRef } from 'react';
import { type t, css, DEFAULTS } from './common.ts';

export const IFrame: React.FC<t.IFrameProps> = (props) => {
  const { width, height, loading = 'eager', silent = false } = props;
  const content = wrangle.content(props);
  const ref = useRef<HTMLIFrameElement>(null);

  /**
   * Handlers:
   */
  const handleLoad: React.ReactEventHandler<HTMLIFrameElement> = (ev) => {
    const node = ref.current ?? (ev.currentTarget as HTMLIFrameElement | null);
    let href = content.src ?? '';
    try {
      href = node?.contentWindow?.location.href ?? href;
    } catch (error) {
      // [Cross-origin]: fall back to the live element src (updates on in-iframe navigation).
      href = node?.src || href;
      if (!silent) console.warn('contentWindow/error:', error);
    }
    props.onLoad?.({ ref, href });
  };

  /**
   * Lifecycle:
   */
  useEffect(() => props.onReady?.({ ref }), []);

  /**
   * Render:
   */
  const styles = {
    base: css({ position: 'relative', width, height }),
    iframe: css({
      Absolute: 0,
      width: width ?? '100%',
      height: height ?? '100%',
      border: 'none',
      background: 'transparent',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {props.src && (
        <iframe
          className={styles.iframe.class}
          ref={ref}
          src={content.src}
          srcDoc={content.html}
          title={props.title}
          name={props.name}
          allow={props.allow}
          allowFullScreen={props.allowFullScreen}
          referrerPolicy={props.referrerPolicy}
          loading={loading}
          sandbox={wrangle.sandbox(props)}
          onLoad={handleLoad}
        />
      )}
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  sandbox(props: t.IFrameProps) {
    const { sandbox = DEFAULTS.sandbox } = props;
    return Array.isArray(sandbox) ? sandbox.join(' ') : undefined; // NB: <undefined> === all restrictions applied.
  },

  content(props: t.IFrameProps): { src?: string; html?: string } {
    if (!props.src) return { src: undefined, html: undefined };
    if (typeof props.src === 'string') return { src: props.src };
    return { src: props.src.url, html: props.src.html };
  },
};
