import React, { useEffect, useRef } from 'react';
import { type t, css, DEFAULTS } from './common.ts';

export const IFrame: React.FC<t.IFrameProps> = (props) => {
  const { width, height, loading = 'eager' } = props;
  const content = wrangle.content(props);
  const ref = useRef<HTMLIFrameElement>(null);

  /**
   * Handlers:
   */
  const handleLoad = () => {
    let href = content.src ?? '';
    try {
      href = ref.current?.contentWindow?.location.href ?? href;
    } catch (error) {
      // [Ignore]: This will be a cross-origin block.
      //           Fire the best guess at what the URL is.
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
