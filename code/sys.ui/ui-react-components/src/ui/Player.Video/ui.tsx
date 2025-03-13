import React, { useEffect, useRef, useState } from 'react';

import type { MediaPlayerInstance } from '@vidstack/react';
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { PlyrLayout, plyrLayoutIcons } from '@vidstack/react/player/layouts/plyr';

import { type t, css, DEFAULTS } from './common.ts';
import { Styles } from './u.styles.ts';
import { useSignalBinding } from './use.SignalBinding.ts';

Styles.import(); // NB: dynamic import of [.css] files.

/**
 * Component.
 */
export const VideoPlayer: React.FC<t.VideoPlayerProps> = (props) => {
  const { signals } = props;
  const src = props.video || DEFAULTS.video;
  const p = signals?.props;

  const playerRef = useRef<MediaPlayerInstance>(null);
  useSignalBinding({ signals, playerRef });

  const [, setRender] = useState(0);
  const redraw = () => setRender((n) => n + 1);

  /**
   * Lifecycle.
   */
  useEffect(() => {
    if (!p) return;
    p.ready.value = Styles.loaded;
    redraw();
  }, [Styles.loaded]);

  // NB: avoid a FOUC ("Flash Of Unstyled Content").
  if (!Styles.loaded) return null;

  /**
   * Render.
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
