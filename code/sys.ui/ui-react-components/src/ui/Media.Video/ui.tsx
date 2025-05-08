import React from 'react';
import { type t, Color, css, D, Time, useSizeObserver } from './common.ts';
import { useUserMedia } from './use.UserMedia.ts';

type P = t.MediaVideoProps;

export const MediaVideo: React.FC<P> = (props) => {
  const { debug = false, fit = D.fit, aspectRatio = D.aspectRatio, onReady } = props;
  const constraints = wrangle.constraints(props);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const { stream, error } = useUserMedia(constraints);
  const [isResizing, setResizing] = React.useState(false);
  const size = useSizeObserver();
  const isReady = size.ready;

  /**
   * Effect: track resizing (allow hide to avoid flashing).
   */
  React.useEffect(() => {
    if (!isReady) return;
    const time = Time.until();
    setResizing(true);
    time.delay(500, () => setResizing(false));
    return time.dispose;
  }, [size.count, isReady]);

  /**
   * Effect: Assign stream to <video> once available.
   */
  React.useEffect(() => {
    const video = videoRef.current;
    if (video && stream) {
      video.srcObject = stream;
      video.play().catch(() => {
        /* ignored (autoplay/etc) */
      });
      onReady?.({ stream });
    }
  }, [stream, onReady]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      opacity: !isReady || isResizing ? 0 : 1,
      transition: isReady ? `opacity 200ms` : undefined,
      color: theme.fg,
      overflow: 'hidden', //       ←  hides any single-frame gaps.
      contain: 'paint style', //   ←  isolates paints to this box.
      display: 'grid',
    }),
    error: css({ padding: 8 }),
    video: css({
      display: 'block',
      inlineSize: '100%',
      maxBlockSize: '100%', // NB: ↕ cap height at container edge
      borderRadius: props.borderRadius ?? D.borderRadius,
      width: '100%',
      height: fit === 'responsive' ? 'auto' : '100%',
      objectFit: fit === 'cover' ? 'cover' : props.fit === 'contain' ? 'contain' : 'unset',
      willChange: `transform`, //       ← (pre-promote to GPU).
      backfaceVisibility: 'hidden', //  ← Chrome/Safari sometimes need this nudge
      aspectRatio,
    }),
  };

  return (
    <div ref={size.ref} className={css(styles.base, props.style).class}>
      {error && <div className={styles.error.class}>{error.message}</div>}
      {!error && <video ref={videoRef} className={styles.video.class} playsInline muted />}
    </div>
  );
};

MediaVideo.displayName = D.displayName;

/**
 * Helpers:
 */
const wrangle = {
  constraints(props: P): MediaStreamConstraints {
    return { ...D.constraints, ...props.constraints };
  },
} as const;
