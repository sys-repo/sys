import React, { useEffect, useRef } from 'react';

import { type t, Color, css, D, Rx } from './common.ts';
import { getDevice } from './u.getDevice.ts';
import { Info } from './ui.Info.tsx';
import { useVideoStream } from './use.VideoStream.ts';

export const VideoStream: React.FC<t.MediaVideoStreamProps> = (props) => {
  const {
    debug = false,
    borderRadius = D.borderRadius,
    aspectRatio = D.aspectRatio,
    muted = D.muted,
    filter,
    constraints,
    zoom,
  } = props;

  /**
   * Hook: acquire stream (with filtered derivative).
   */
  const video = useVideoStream(props.stream ?? constraints, { filter, zoom });

  /**
   * Ref: <video> element.
   */
  const videoRef = useRef<HTMLVideoElement>(null);

  /**
   * Effect: bind the best available stream to <video>.
   * Prefer filtered; fall back to raw so we never go black during re-acquire.
   */
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const best: MediaStream | null = video.stream.filtered ?? video.stream.raw ?? null;
    if (el.srcObject !== best) el.srcObject = best;

    // Cleanup: only clear if we're still bound to the same object.
    return () => {
      if (videoRef.current && videoRef.current.srcObject === best) {
        videoRef.current.srcObject = null;
      }
    };
  }, [video.stream.filtered?.id, video.stream.raw?.id]);

  /**
   * Effect: fire onReady when both streams are live and device is discovered.
   */
  useEffect(() => {
    const life = Rx.lifecycle();
    const { stream, aspectRatio } = video;
    if (!video.ready || !stream.raw || !stream.filtered) return;

    getDevice(stream.raw).then((device) => {
      if (life.disposed) return;
      if (!device) {
        console.error(`Device could not be retrieved from stream: ${stream.raw?.id}`);
        return;
      }
      props.onReady?.({ stream, aspectRatio, device });
    });

    return life.dispose;
  }, [video.ready, video.stream.raw?.id, video.stream.filtered?.id]);

  /**
   * Effect: bubble hook errors to the caller.
   */
  useEffect(() => {
    if (!video.error) return;
    props.onError?.({ err: new Error(video.error.message) });
  }, [video.error?.message]);

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
      overflow: 'hidden',
    }),
    video: css({
      Absolute: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius,
    }),
    info: css({ Absolute: [8, null, null, 8] }),
  };

  const infoStream = video.stream.filtered ?? video.stream.raw;
  const elInfo =
    debug && infoStream ? (
      <Info
        key={infoStream.id}
        style={styles.info}
        theme={theme.name}
        stream={infoStream}
        filter={props.debugFilter}
      />
    ) : null;

  return (
    <div className={css(styles.base, props.style).class}>
      <video
        ref={videoRef}
        className={styles.video.class}
        muted={muted}
        autoPlay
        playsInline
        disablePictureInPicture
      />
      {elInfo}
    </div>
  );
};
