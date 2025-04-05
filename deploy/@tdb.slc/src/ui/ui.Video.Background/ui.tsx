import React from 'react';
import { type t, css, DEFAULTS, VimeoBackground } from './common.ts';

type P = t.VideoBackgroundProps;

export const VideoBackground: React.FC<P> = (props) => {
  const { state } = props;

  const backgroundVideo = state.props.background.video;
  const opacity = backgroundVideo.opacity.value;
  const src = backgroundVideo.src.value;
  const playing = backgroundVideo.playing.value ?? DEFAULTS.playing;
  const playerRef = React.useRef<t.VimeoIFrame>();

  /**
   * Render:
   */
  const styles = {
    base: css({ position: 'relative', pointerEvents: 'none' }),
    video: css({ Absolute: 0 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <VimeoBackground
        style={styles.video}
        video={src}
        playing={playing}
        blur={playing ? 0 : 10}
        opacity={opacity}
        onReady={(api) => (playerRef.current = api)}
      />
    </div>
  );
};
