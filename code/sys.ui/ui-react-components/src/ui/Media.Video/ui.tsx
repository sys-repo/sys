import React, { useEffect, useRef } from 'react';
import { type t, Color, css, D } from './common.ts';
import { useUserVideo } from './use.UserVideo.ts';

export const VideoStream: React.FC<t.VideoStreamProps> = (props) => {
  const { debug = false, filter, constraints, borderRadius = D.borderRadius } = props;
  const { stream } = useUserVideo(constraints, filter);

  /**
   * Effect: keep video synced with current stream.
   */
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream ?? null;
    if (stream) props.onReady?.({ stream });
  }, [stream]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      borderRadius,
    }),
    video: css({
      Absolute: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <video ref={videoRef} autoPlay muted playsInline className={styles.video.class} />
    </div>
  );
};
