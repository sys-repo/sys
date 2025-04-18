import type { MediaPlayerInstance } from '@vidstack/react';
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { PlyrLayout, plyrLayoutIcons } from '@vidstack/react/player/layouts/plyr';
import React, { useEffect, useRef, useState } from 'react';

import { type t, css, DEFAULTS, Signal, Style, useSizeObserver } from './common.ts';
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
  const showVolumeControl = p?.showVolumeControl?.value ?? D.showVolumeControl;
  const autoPlay = p?.autoPlay.value ?? D.autoPlay;
  const muted = autoPlay ? true : p?.muted.value ?? D.muted;
  const aspectRatio = p?.aspectRatio.value ?? D.aspectRatio;
  const cornerRadius = p?.cornerRadius.value ?? D.cornerRadius;
  const scale = p?.scale.value ?? D.scale;
  const loop = p?.loop.value ?? D.loop;

  const size = useSizeObserver();
  const [calcScale, setCalcScale] = useState<number>();

  const [playerKey, setPlayerKey] = useState(0);
  const playerRef = useRef<MediaPlayerInstance>(null);
  useSignalBinding({ signals, playerRef });

  /**
   * Effect: ensure redraw on signal changes.
   */
  Signal.useRedrawEffect(() => {
    if (!p) return;
    p.ready.value;
    p.src.value;

    p.muted.value;
    p.autoPlay.value;
    p.loop.value;

    p.showControls.value;
    p.showFullscreenButton.value;
    p.showVolumeControl.value;
    p.cornerRadius.value;
    p.aspectRatio.value;
    p.scale.value;
  });

  /**
   * Effect: monitor size differene
   */
  useEffect(() => {
    const { width, height } = size;
    const fn = p?.scale.value;
    if (width === undefined || height === undefined) return;
    if (typeof fn !== 'function') {
      setCalcScale(undefined);
    } else {
      const enlargeBy = (increment: t.Pixels) => wrangle.scale(width, height, increment);
      setCalcScale(fn({ width, height, enlargeBy }));
    }
  }, [size.width, size.height, scale]);

  /**
   * Effect (HACK): ensure player style-sheets work consistently when bundled and deployed.
   */
  useEffect(() => {
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
  const themeStyles = useThemeStyles('Plyr');
  const isReady = Boolean(themeStyles.loaded && !!p?.ready.value && size.ready);
  const styles = {
    base: css({
      overflow: 'hidden',
      display: 'grid',
      visibility: isReady ? 'visible' : 'hidden', // NB: avoid a FOUC ("Flash Of Unstyled Content").
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
        volumeSlider: showVolumeControl ? undefined : false,
      }}
    />
  );

  const elPlayer = (
    <MediaPlayer
      key={playerKey}
      ref={playerRef}
      style={{
        transform: `scale(${calcScale ?? scale ?? 1})`,
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
      onEnded={(e) => {
        // Hack: force the Player back to the first-frame.
        if (!loop) setPlayerKey((n) => n + 1);
        props.onEnded?.(e);
      }}
    >
      <MediaProvider />
      {elPlyrLayout}
    </MediaPlayer>
  );

  return (
    <div ref={size.ref} className={css(styles.base, props.style).class}>
      {elPlayer}
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  scale(width: t.Pixels, height: t.Pixels, increment: t.Pixels) {
    if (width === 0 || height === 0) return 1;
    const scaleX = (width + increment) / width;
    const scaleY = (height + increment) / height;
    return Math.max(scaleX, scaleY); // NB: Return the greater scale factor to ensure both dimensions are increased by at least increment.
  },
} as const;
