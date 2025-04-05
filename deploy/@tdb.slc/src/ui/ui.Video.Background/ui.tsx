import React from 'react';
import { type t, DEFAULTS, VimeoBackground, css } from './common.ts';

type P = t.VideoBackgroundProps;


export const VideoBackground: React.FC<P> = (props) => {
  const { state, fadeDuration = DEFAULTS.fadeDuration } = props;

  const backgroundVideo = state.props.background.video;
  const opacity = backgroundVideo.opacity.value;
  const src = backgroundVideo.src.value;
  const playing = backgroundVideo.playing.value ?? DEFAULTS.playing;

  /**
   * Render:
   */
  const transition = `opacity ${fadeDuration}s`;
  const styles = {
    base: css({ position: 'relative', pointerEvents: 'none' }),
    video: css({
      Absolute: 0,
      opacity: playing ? opacity : 0,
      transition,
    }),
    still: css({
      Absolute: 0,
      opacity: !playing ? opacity : 0,
      transition,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <VimeoBackground video={src} playing={playing} style={styles.video} />
      <VimeoBackground video={src} playing={false} blur={60} style={styles.still} />
    </div>
  );
};
