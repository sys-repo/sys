import React, { useRef } from 'react';

import type { MediaPlayerInstance } from '@vidstack/react';
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { PlyrLayout, plyrLayoutIcons } from '@vidstack/react/player/layouts/plyr';

import { type t, css, DEFAULTS, Signal, Style } from './common.ts';
import { useSignalBinding } from './use.SignalBinding.ts';
import { useThemeStyles } from './use.ThemeStyles.ts';

const D = DEFAULTS;

/**
 * Component:
 */
export const VideoPlayer: React.FC<t.VideoPlayerProps> = (props) => {
  const { signals } = props;
  const p = signals?.props;

  const src = p?.src.value ?? D.video;
  const showControls = p?.showControls.value ?? D.showControls;
  const showFullscreenButton = p?.showFullscreenButton.value ?? D.showFullscreenButton;
  const autoPlay = p?.autoPlay.value ?? D.autoPlay;
  const muted = autoPlay ? true : p?.muted.value ?? D.muted;
  const aspectRatio = p?.aspectRatio.value ?? D.aspectRatio;
  const cornerRadius = p?.cornerRadius.value ?? D.cornerRadius;
  const loop = p?.loop.value ?? D.loop;

  const themeStyles = useThemeStyles('Plyr');
  const playerRef = useRef<MediaPlayerInstance>(null);
  useSignalBinding({ signals, playerRef });

  // Ensure redraw on signal changes.
  Signal.useRedrawEffect(() => {
    if (!p) return;
    p.ready.value;
    p.src.value;

    p.muted.value;
    p.autoPlay.value;
    p.loop.value;

    p.showControls.value;
    p.showFullscreenButton.value;
    p.cornerRadius.value;
    p.aspectRatio.value;
  });

  /**
   * HACK: ensure player style-sheets work consistently when deployed (https).
   */
  React.useEffect(() => {
    const sheet = Style.Dom.stylesheet();
    sheet.rule('[data-media-provider]', { width: '100%', height: '100%' });
    sheet.rule('[data-media-provider] iframe', {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      objectPosition: 'center',
    });
  }, []);

  /**
   * Render:
   */
  const styles = {
    base: css({
      overflow: 'hidden',
      display: 'grid',
      visibility: themeStyles.loaded && p?.ready.value ? 'visible' : 'hidden', // NB: avoid a FOUC ("Flash Of Unstyled Content").
      lineHeight: 0, // NB: ensure no "baseline" gap below the <MediaPlayer>.
    }),
  };

  const elPlyrLayout = showControls && (
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
        '--plyr-aspect-ratio': aspectRatio, // e.g. '4/3', '2.39/1', '1/1', etc...
      }}
      /**
       * Props:
       */
      title={props.title}
      src={src}
      playsInline={true}
      aspectRatio={aspectRatio}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      /**
       * Handlers:
       */
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
