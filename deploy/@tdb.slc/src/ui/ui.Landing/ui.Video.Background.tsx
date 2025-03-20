import React from 'react';
import { type t, css, Player } from './common.ts';

export type VideoBackgroundProps = {
  opacity?: t.Percent;
  style?: t.CssInput;
};

type P = VideoBackgroundProps;

/**
 * Component:
 */
export const VideoBackground: React.FC<P> = (props) => {
  const { opacity = 0.2 } = props;

  const videoSignalsRef = React.useRef(
    Player.Video.signals({
      src: 'vimeo/499921561', // Tubes.
      showControls: false,
      autoPlay: true,
      muted: true,
      loop: true,
    }),
  );
  const video = videoSignalsRef.current;

  /**
   * Render:
   */
  const styles = {
    base: css({ position: 'relative', display: 'grid' }),
    player: css({ opacity, transition: `opacity 0.3ms` }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Player.Video.View style={styles.player} signals={video} />
    </div>
  );
};
