import React from 'react';
import { type t, css, D, VimeoBackground } from './common.ts';

type P = t.VideoBackgroundProps;

export const VideoBackground: React.FC<P> = (props) => {
  const { state } = props;

  const p = state.props.background.video;
  const src = p.src.value;
  const opacity = p.opacity.value;
  const blur = p.blur.value;
  const playing = p.playing.value ?? D.playing;

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
        video={src}
        playing={playing}
        blur={blur}
        opacity={opacity}
        onReady={(api) => (playerRef.current = api)}
        style={styles.video}
      />
    </div>
  );
};
