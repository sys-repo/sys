import React, { useEffect, useRef, useState } from 'react';

import type { MediaPlayerInstance } from '@vidstack/react';
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { PlyrLayout, plyrLayoutIcons } from '@vidstack/react/player/layouts/plyr';

import { type t, Signal, css, DEFAULTS } from './common.ts';
import { useSignalBinding } from './use.SignalBinding.ts';
import { useThemeStyles } from './use.ThemeStyles.ts';

/**
 * Component
 */
export const VideoPlayer: React.FC<t.VideoPlayerProps> = (props) => {
  const { signals } = props;
  const src = props.video || DEFAULTS.video;
  const p = signals?.props;
  const showFullscreenButton = p?.fullscreenButton.value ?? false;

  const themeStyles = useThemeStyles('Plyr');
  const playerRef = useRef<MediaPlayerInstance>(null);
  useSignalBinding({ signals, playerRef });

  const [, setRender] = useState(0);
  const redraw = () => setRender((n) => n + 1);

  Signal.useEffect(() => {
    p?.fullscreenButton.value;
    redraw();
  });

  /**
   * Render
   */
  const styles = {
    base: css({
      lineHeight: 0, // NB: ensure no "baseline" gap below the <MediaPlayer>.
      display: themeStyles.loaded ? 'block' : 'none', // NB: avoid a FOUC ("Flash Of Unstyled Content").
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
      onCanPlay={() => {
        if (p) p.ready.value = true;
      }}
    >
      <MediaProvider />
      <PlyrLayout
        // thumbnails="https://files.vidstack.io/sprite-fight/thumbnails.vtt"
        icons={plyrLayoutIcons}
        slots={{
          settings: false,
          fullscreenButton: showFullscreenButton ? undefined : false,
        }}
      />
    </MediaPlayer>
  );

  return <div className={css(styles.base, props.style).class}>{elPlayer}</div>;
};
