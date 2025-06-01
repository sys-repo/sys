import React from 'react';
import { type t, Color, css, D } from './common.ts';

export const VideoElement: React.FC<t.VideoElementProps> = (props) => {
  const { signals, debug = false } = props;
  const p = signals?.props;
  const aspectRatio = p?.aspectRatio.value ?? D.aspectRatio;
  const src = p?.src.value;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      aspectRatio,
    }),
    video: css({
      width: '100%',
      aspectRatio,
      display: 'block',
      objectFit: 'cover',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <video
        className={styles.video.class}
        src={src}
        controls
        preload={'metadata'} // NB: faster paint → grabs just the headers first.
        playsInline //          NB: avoid fullscreen hijack (iOS).
      />
    </div>
  );
};
