import type { MediaPlayerInstance, PlayerSrc } from '@vidstack/react';

import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { PlyrLayout, plyrLayoutIcons } from '@vidstack/react/player/layouts/plyr';
import React, { useEffect, useRef, useState } from 'react';

import { type t, Color, css, DEFAULTS, Signal, Style, useSizeObserver } from './common.ts';
import { FadeMask } from './ui.FadeMask.tsx';
import { useSignalBinding } from './use.SignalBinding.ts';
import { useThemeStyles } from './use.ThemeStyles.ts';

const D = DEFAULTS;
type P = t.VideoPlayerProps;

/**
 * Component:
 */
export const VideoPlayer: React.FC<P> = (props) => {
  const { signals, debug = false } = props;
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

  const [playerKeyCount, setPlayerKeyCount] = useState(0);
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
    p.fadeMask.value;
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
  const theme = Color.theme(props.theme);
  const themeStyles = useThemeStyles('Plyr');
  const isReady = Boolean(themeStyles.loaded && !!p?.ready.value && size.ready);
  const styles = {
    base: css({
      position: 'relative',
      display: 'grid',
    }),
    body: css({
      overflow: 'hidden',
      display: 'grid',
      visibility: isReady ? 'visible' : 'hidden', // NB: avoid a FOUC ("Flash Of Unstyled Content").
      lineHeight: 0, // NB: ensure no "baseline" gap below the <MediaPlayer>.
    }),
    debug: css({
      Absolute: [-20, null, null, 6],
      color: theme.fg,
      fontSize: 11,
      opacity: 0.4,
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
      key={`${src}:${playerKeyCount}`}
      ref={playerRef}
      style={{
        transform: `scale(${calcScale ?? scale ?? 1})`,
        '--plyr-border-radius': `${cornerRadius}px`,
        '--plyr-aspect-ratio': aspectRatio, // e.g. '4/3', '2.39/1', '1/1', etc...
      }}
      // Hacks:
      streamType={'on-demand'}
      preload={'metadata'}
      crossOrigin={'anonymous'}
      /**
       * Props:
       */
      title={props.title}
      src={wrangle.src(src)}
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
        if (!loop) setPlayerKeyCount((n) => n + 1);
        props.onEnded?.(e);
      }}
    >
      <MediaProvider />
      {elPlyrLayout}
    </MediaPlayer>
  );

  const mask = p?.fadeMask.value;
  const elTopMask = mask && <FadeMask mask={mask} theme={theme.name} />;
  const elDebug = debug && <div className={styles.debug.class}>{`src: ${src}`}</div>;

  return (
    <div ref={size.ref} className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>{elPlayer}</div>
      {elTopMask}
      {elDebug}
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

  src(src: string): string | PlayerSrc {
    if (src.startsWith('vimeo/')) return src;

    const ext = src.split(/[?#]/, 1)[0].toLowerCase(); // NB: strip query/hash on URL.
    if (ext.endsWith('.webm')) return { src, type: 'video/webm' };
    if (ext.endsWith('.mp4')) return { src, type: 'video/mp4' };
    return src;
  },
} as const;
