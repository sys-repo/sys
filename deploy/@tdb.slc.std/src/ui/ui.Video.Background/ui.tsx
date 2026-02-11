import React from 'react';
import { type t, css, D, VimeoBackground } from './common.ts';

type P = t.VideoBackgroundProps;

export const VideoBackground: React.FC<P> = (props) => {
  const {
    video = D.TUBES.src,
    playing = D.playing,
    opacity = D.opacity,
    blur = D.blur,
  } = props;

  /**
   * Render:
   */
  const styles = {
    base: css({ position: 'relative', pointerEvents: 'none' }),
    video: css({ Absolute: 0 }),
  };

  return (
    <div data-component={D.displayName} className={css(styles.base, props.style).class}>
      <VimeoBackground
        video={video}
        playing={playing}
        blur={blur}
        opacity={opacity}
        theme={props.theme}
        style={styles.video}
      />
    </div>
  );
};
