import React from 'react';
import { type t, css } from './common.ts';

import '@vidstack/react/player/styles/base.css';
import '@vidstack/react/player/styles/plyr/theme.css';

import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { PlyrLayout, plyrLayoutIcons } from '@vidstack/react/player/layouts/plyr';

export const DEFAULTS = {
  video: 'vimeo/499921561', // Tubes.
} as const;

/**
 * Sample properties.
 */
export type VideoPlayerProps = {
  video?: string;
  title?: string;
  style?: t.CssInput;
};

/**
 * Component (UI).
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = (props) => {
  const src = props.video || DEFAULTS.video;

  const styles = {
    base: css({}),
  };

  const elPlayer = (
    <MediaPlayer title={props.title} src={src} playsInline={true}>
      <MediaProvider />
      <PlyrLayout
        // thumbnails="https://files.vidstack.io/sprite-fight/thumbnails.vtt"
        icons={plyrLayoutIcons}
      />
    </MediaPlayer>
  );

  return <div className={css(styles.base, props.style).class}>{elPlayer}</div>;
};
