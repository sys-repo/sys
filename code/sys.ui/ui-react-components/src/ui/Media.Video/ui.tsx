import React, { useEffect, useRef } from 'react';
import { type t, Color, css, D, rx } from './common.ts';
import { getDevice } from './u.getDevice.ts';
import { useVideoStream } from './use.VideoStream.ts';

export const VideoStream: React.FC<t.MediaVideoStreamProps> = (props) => {
  const {
    debug = false,
    borderRadius = D.borderRadius,
    filter,
    constraints,
    aspectRatio,
    zoom,
  } = props;

  const video = useVideoStream({ constraints, filter, zoom });

  /**
   * Effect: fire onReady when stream acquired.
   */
  useEffect(() => {
    const life = rx.lifecycle();
    const { stream, aspectRatio } = video;
    if (!stream.raw || !stream.filtered) return;

    getDevice(stream.raw).then((device) => {
      if (life.disposed) return;
      if (!device) {
        console.error(`Device could not be retrieved from stream: ${stream.raw?.id}`);
        return;
      }
      props.onReady?.({ stream, aspectRatio, device });
    });

    return life.dispose;
  }, [video.stream.raw?.id]);

  /**
   * Effect: keep video synced with current stream.
   */
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = video.stream.filtered ?? null;
  }, [video.stream.filtered?.id]);

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
      aspectRatio,
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
