import React from 'react';
import { type t, Color, css, Player } from './common.ts';

import { CanvasMini } from '../Canvas.Mini/mod.ts';

export const Home: React.FC<t.HomeProps> = (props) => {
  const signalsRef = React.useRef(
    Player.Video.signals({
      autoPlay: true,
      muted: true,
      showControls: false,
      loop: true,
    }),
  );

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: Color.DARK,
      color: theme.fg,
    }),
    body: css({
      Absolute: 10,
      display: 'grid',
      placeItems: 'center',
    }),
    video: {
      base: css({ Absolute: 0, display: 'grid' }),
      player: css({ opacity: 0.2 }),
    },
  };

  const elVideo = (
    <div className={styles.video.base.class}>
      <Player.Video.View
        style={styles.video.player}
        video={'vimeo/499921561'}
        signals={signalsRef.current}
      />
    </div>
  );

  const elBody = (
    <div className={styles.body.class}>
      <CanvasMini theme={'Dark'} selected={'purpose'} />
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elVideo}
      {elBody}
    </div>
  );
};
