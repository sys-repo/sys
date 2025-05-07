import React from 'react';
import { type t, Color, css, D } from './common.ts';
import { useUserMedia } from './use.UseMedia.ts';

type P = t.MediaRecorderProps;

export const MediaRecorder: React.FC<P> = (props) => {
  const { debug = false, onReady } = props;
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
      onReady?.(stream);
    }
  }, [stream, onReady]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      placeItems: 'center',
    }),
    video: css({
      width: '100%',
      height: 'auto',
      borderRadius: 4,
    }),
    error: css({ padding: 8 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {error && <div className={styles.error.class}>{error.message}</div>}
      {!error && <video ref={videoRef} className={styles.video.class} playsInline muted />}
    </div>
  );
};

MediaRecorder.displayName = D.displayName;

/**
 * Helpers:
 */
const wrangle = {
  constraints(props: P): MediaStreamConstraints {
    return { ...D.constraints, ...props.constraints };
  },
} as const;
