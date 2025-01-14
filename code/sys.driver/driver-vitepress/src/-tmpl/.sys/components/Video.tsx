import React from 'react';

import '@vidstack/react/player/styles/base.css';
import '@vidstack/react/player/styles/plyr/theme.css';

import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { PlyrLayout, plyrLayoutIcons } from '@vidstack/react/player/layouts/plyr';

export type VideoProps = {
  title?: string;
  src?: string;
};

/**
 * Component
 */
export const Video: React.FC<VideoProps> = (props: VideoProps) => {
  const src = props.src || DEFAULTS.src;
  return (
    <MediaPlayer title={props.title} src={src} playsInline={true}>
      <MediaProvider />
      <PlyrLayout
        // thumbnails="https://files.vidstack.io/sprite-fight/thumbnails.vtt"
        icons={plyrLayoutIcons}
      />
    </MediaPlayer>
  );
};

/**
 * Constants
 */
export const DEFAULTS = {
  src: 'vimeo/499921561', // Tubes.
} as const;
