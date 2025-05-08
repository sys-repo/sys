import React from 'react';
import { type t, Color, css, D, useUserMedia } from './common.ts';

type P = t.MediaVideoProps;

export const MediaVideo: React.FC<P> = (props) => {
  const { debug = false, fit = D.fit, aspectRatio = D.aspectRatio, onReady } = props;
  const constraints = wrangle.constraints(props);

  const { stream, error } = useUserMedia(constraints);
  const videoRef = React.useRef<HTMLVideoElement>(null);

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
    base: css({ color: theme.fg, display: 'grid' }),
    error: css({ padding: 8 }),
    video: css({
      inlineSize: '100%',
      maxBlockSize: '100%', // NB: ↕ cap height at container edge
      borderRadius: props.borderRadius ?? D.borderRadius,
      width: '100%',
      height: fit === 'responsive' ? 'auto' : '100%',
      objectFit: fit === 'cover' ? 'cover' : props.fit === 'contain' ? 'contain' : 'unset',
      ...(aspectRatio && { aspectRatio }),
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
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
