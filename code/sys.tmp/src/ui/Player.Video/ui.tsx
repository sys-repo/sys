import React from 'react';
import { type t, css, DEFAULTS } from './common.ts';

import '@vidstack/react/player/styles/base.css';
import '@vidstack/react/player/styles/plyr/theme.css';

import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { PlyrLayout, plyrLayoutIcons } from '@vidstack/react/player/layouts/plyr';

/**
 * Component.
 */
export const VideoPlayer: React.FC<t.VideoPlayerProps> = (props) => {
  const src = props.video || DEFAULTS.video;
  const styles = {
    base: css({}),
  };

  const elPlayer = (
    <MediaPlayer
      title={props.title}
      src={src}
      playsInline={true}
      onPlay={props.onPlay}
      onPlaying={props.onPlaying}
      onPause={props.onPause}
    >
      <MediaProvider />
      <PlyrLayout
        // thumbnails="https://files.vidstack.io/sprite-fight/thumbnails.vtt"
        icons={plyrLayoutIcons}
      />
    </MediaPlayer>
  );

  return <div className={css(styles.base, props.style).class}>{elPlayer}</div>;
};
