import React, { useRef } from 'react';

import type { MediaPlayerInstance } from '@vidstack/react';
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { PlyrLayout, plyrLayoutIcons } from '@vidstack/react/player/layouts/plyr';

import { type t, css, DEFAULTS, Signal } from './common.ts';
import { useSignalBinding } from './use.SignalBinding.ts';
import { useThemeStyles } from './use.ThemeStyles.ts';

const D = DEFAULTS;

/**
 * Component
 */
export const VideoPlayer: React.FC<t.VideoPlayerProps> = (props) => {
  const { signals } = props;
  const src = props.video || D.video;
  const p = signals?.props;

  const showControls = p?.showControls.value ?? D.showControls;
  const showFullscreenButton = p?.showFullscreenButton.value ?? D.showFullscreenButton;
  const autoPlay = p?.autoPlay.value ?? D.autoPlay;
  const muted = autoPlay ? true : p?.muted.value ?? D.muted;
  const aspectRatio = p?.aspectRatio.value ?? D.aspectRatio;
  const cornerRadius = p?.cornerRadius.value ?? D.cornerRadius;

  const themeStyles = useThemeStyles('Plyr');
  const playerRef = useRef<MediaPlayerInstance>(null);
  useSignalBinding({ signals, playerRef });

  Signal.useRedrawEffect(() => {
    p?.ready.value;

    p?.muted.value;
    p?.autoPlay.value;
    p?.loop.value;

    p?.showControls.value;
    p?.showFullscreenButton.value;
    p?.cornerRadius.value;
    p?.aspectRatio.value;
    p?.muted.value;
    p?.autoPlay.value;
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

  const elPlyrLayout = (
    <PlyrLayout
      // thumbnails="https://files.vidstack.io/sprite-fight/thumbnails.vtt"
      icons={plyrLayoutIcons}
      slots={{
        settings: false,
        fullscreenButton: showFullscreenButton ? undefined : false,
      }}
    />
  );

  const elPlayer = (
    <MediaPlayer
      ref={playerRef}
      style={{
        '--plyr-border-radius': `${cornerRadius}px`,
        '--plyr-aspect-ratio': aspectRatio, // e.g. "16/9" or "9/16"
      }}
      title={props.title}
      src={src}
      playsInline={true}
      aspectRatio={aspectRatio}
      autoPlay={autoPlay}
      muted={muted}
      // Handlers:
      onPlay={props.onPlay}
      onPlaying={props.onPlaying}
      onPause={props.onPause}
      onCanPlay={() => {
        if (p) p.ready.value = true;
      }}
    >
      <MediaProvider />
      {elPlyrLayout}
    </MediaPlayer>
  );

  return <div className={css(styles.base, props.style).class}>{elPlayer}</div>;
};
