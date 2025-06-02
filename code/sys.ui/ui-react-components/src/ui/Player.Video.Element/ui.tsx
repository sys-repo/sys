import React, { useRef } from 'react';
import { type t, Color, css, D } from './common.ts';
import { useSignals } from './use.Signals.ts';

export const VideoElement: React.FC<t.VideoElementProps> = (props) => {
  const { signals, debug = false } = props;
  const p = signals?.props;
  const src = p?.src.value;
  const aspectRatio = p?.aspectRatio.value ?? D.aspectRatio;
  const borderRadius = p?.cornerRadius.value ?? D.cornerRadius;

  const videoRef = useRef<HTMLVideoElement>(null);
  useSignals(videoRef, signals);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      aspectRatio,
      borderRadius,
      overflow: 'hidden',
    }),
    video: css({
      width: '100%',
      aspectRatio,
      display: 'block',
      objectFit: 'cover',
      borderRadius,
    }),
    debug: css({
      Absolute: [6, null, null, 6],
      color: theme.fg,
      fontSize: 11,
      opacity: 0.4,
    }),
  };

  const elDebug = debug && <div className={styles.debug.class}>{`src: ${src}`}</div>;

  return (
    <div className={css(styles.base, props.style).class}>
      <video
        ref={videoRef}
        className={styles.video.class}
        src={src}
        preload={'metadata'} // NB: faster paint → grabs just the headers first.
        controls={true}
        disablePictureInPicture={true}
        playsInline={true}
        autoPlay={p?.autoPlay.value}
        muted={p?.muted.value}
        loop={p?.loop.value}
        onEnded={(e) => {
          if (props.onEnded && signals) props.onEnded({ video: signals });
        }}
      />
      {elDebug}
    </div>
  );
};
