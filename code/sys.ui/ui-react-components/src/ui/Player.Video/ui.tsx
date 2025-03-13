import React, { useRef } from 'react';
import { type t, css, DEFAULTS } from './common.ts';
import { useSignalBinding } from './use.SignalBinding.ts';

import { type MediaPlayerInstance, MediaPlayer, MediaProvider } from '@vidstack/react';
import { PlyrLayout, plyrLayoutIcons } from '@vidstack/react/player/layouts/plyr';
import { Styles } from './u.styles.ts';

Styles.import(); // NB: dynamic import of .css files.

/**
 * Component.
 */
export const VideoPlayer: React.FC<t.VideoPlayerProps> = (props) => {
  const { signals } = props;
  const src = props.video || DEFAULTS.video;

  const playerRef = useRef<MediaPlayerInstance>(null);
  useSignalBinding({ signals, playerRef });

  if (!Styles.loaded) return null;

  /**
   * Render
   */
  const styles = {
    base: css({
      lineHeight: 0, // NB: ensure no "baseline" gap below the MediaPlayer.
    }),
  };

  const elPlayer = (
    <MediaPlayer
      ref={playerRef}
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
        slots={{ settings: false }}
      />
    </MediaPlayer>
  );

  return <div className={css(styles.base, props.style).class}>{elPlayer}</div>;
};
