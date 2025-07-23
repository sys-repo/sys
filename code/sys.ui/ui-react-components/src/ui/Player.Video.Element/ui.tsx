import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PlayerControls } from '../Player.Video.Controls/mod.ts';

import { type t, Color, css, D, M, READY_STATE, useSizeObserver } from './common.ts';

import { Debug } from './ui.Debug.tsx';
import { FadeMask } from './ui.FadeMask.tsx';
import { useAutoplay } from './use.AutoPlay.ts';
import { useBuffered } from './use.Buffered.ts';
import { usePlaybackControls } from './use.Controls.Playback.ts';
import { useControlsVisible } from './use.Controls.Visible.ts';
import { useJumpTo } from './use.JumpTo.ts';
import { useMediaEvents } from './use.Media.Events.ts';
import { useMediaProgress } from './use.Media.Progress.ts';
import { useReadyState } from './use.ReadyState.ts';
import { useScale } from './use.Scale.ts';

export const VideoElement: React.FC<t.VideoElementProps> = (props) => {
  const {
    debug = false,
    src,
    poster,
    loop = D.loop,
    aspectRatio = D.aspectRatio,
    cornerRadius = D.cornerRadius,
    buffered,
    buffering,
    fadeMask,
    jumpTo,

    // Controlled playback + mute:
    playing: playingProp,
    autoPlay = true,
    muted: mutedProp,
    defaultMuted = props.muted ?? false, // ← back-compat bridge.

    onPlayingChange,
    onMutedChange,
  } = props;

  /**
   * Refs:
   */
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldAutoplayRef = React.useRef(true);
  const autoplayPendingRef = useRef(false);
  useEffect(() => {
    /**
     * Track whether we are in an autoplay attempt (for spinner UX).
     * Cleared when element enters playing or we give up.
     */
    shouldAutoplayRef.current = true;
    autoplayPendingRef.current = false;
  }, [src]);

  /**
   * Hooks (Behavior):
   */
  const [pointerOver, setOver] = useState(false);
  const progress = useMediaProgress(videoRef, props);
  const size = useSizeObserver();
  const scale = useScale(size, props.scale);
  useBuffered(videoRef, props);
  useMediaEvents(videoRef, autoplayPendingRef, props);
  useJumpTo(videoRef, progress.duration, jumpTo);

  /**
   * Hook: ReadyState
   */
  const readyState = useReadyState(videoRef, props);
  const notReady = autoplayPendingRef.current || readyState < READY_STATE.HAVE_CURRENT_DATA;
  const isReady = !notReady;

  /** Resolve current element state: */
  const el = videoRef.current;
  const elPaused = el?.paused ?? true;
  const elMuted = el?.muted ?? mutedProp ?? defaultMuted;
  const canPlay = readyState >= READY_STATE.HAVE_FUTURE_DATA;
  const playing = !elPaused && canPlay;
  const autoplayEnabled = shouldAutoplayRef.current && autoPlay && playingProp !== true;

  const controls = usePlaybackControls(videoRef, props);
  const controlsUp = useControlsVisible({ playing, canPlay, pointerOver });

  /**
   * Hook: Autoplay (only when playback is uncontrolled by `playingProp`):
   *  - Intent derived from `autoPlay` (initial true by default).
   *  - Hook will request external state via callbacks.
   */
  useAutoplay({
    enabled: autoplayEnabled,
    src,
    muted: mutedProp ?? defaultMuted ?? false,
    videoRef,
    onStart: () => {
      shouldAutoplayRef.current = false;
      autoplayPendingRef.current = true;
      onPlayingChange?.({ playing: true, reason: 'autoplay-start' });
    },
    onMutedRetry: () => {
      autoplayPendingRef.current = true;
      onMutedChange?.({ muted: true, reason: 'autoplay-muted-retry' });
    },
    onGesturePlay: () => {
      autoplayPendingRef.current = true;
      onPlayingChange?.({ playing: true, reason: 'autoplay-gesture' });
    },
    onGiveUp: () => {
      shouldAutoplayRef.current = false;
      autoplayPendingRef.current = false;
      onPlayingChange?.({ playing: false, reason: 'video-element-event' });
    },
  });

  /**
   * Handlers (user UI interactions):
   */
  const requestTogglePlay = useCallback(() => {
    const value = !playing;
    onPlayingChange?.({ playing: value, reason: 'user-toggle-play' });
  }, [playing, onPlayingChange]);

  const requestToggleMute = useCallback(() => {
    const value = !elMuted;
    onMutedChange?.({ muted: value, reason: 'user-toggle-mute' });
  }, [elMuted, onMutedChange]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      aspectRatio,
      borderRadius: cornerRadius,
      overflow: 'hidden',
    }),
    debug: css({ Absolute: [6, null, null, 6] }),
    controls: css({ Absolute: [null, 0, null, 0] }),
    video: css({
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transform: `scale(${scale.percent})`,
    }),
  };

  const elDebug = debug && (
    <Debug
      //
      style={styles.debug}
      src={src}
      readyState={readyState}
      seeking={!!controls.seeking}
      playing={playing}
    />
  );

  const elMask = fadeMask && <FadeMask mask={fadeMask} theme={theme.name} />;

  return (
    <div
      ref={size.ref}
      className={css(styles.base, props.style).class}
      onMouseEnter={() => setOver(true)}
      onMouseLeave={() => setOver(false)}
      onPointerDown={() => setOver(true)} // ← touch brings controls up.
    >
      <video
        ref={videoRef}
        className={styles.video.class}
        src={src}
        poster={poster}
        preload={'auto'}
        loop={loop}
        playsInline
        disablePictureInPicture
        // ↓ NB: don't pass `muted` or `autoPlay` here; we manage via effects.
        onClick={requestTogglePlay}
      />

      <M.div
        className={styles.controls.class}
        initial={{ bottom: -20, opacity: 0 }}
        animate={{ bottom: controlsUp ? 0 : -20, opacity: controlsUp ? 1 : 0 }}
        transition={{ duration: 0.25 }}
      >
        <PlayerControls
          theme={theme.name}
          enabled={isReady}
          playing={playing}
          muted={elMuted}
          duration={progress.duration}
          currentTime={controls.seeking?.currentTime ?? progress.currentTime} // ← rebased to {crop} value.
          buffering={buffering || notReady}
          buffered={buffered}
          //
          onSeeking={controls.onSeeking}
          onClick={(e) => {
            if (e.button === 'Play') requestTogglePlay();
            if (e.button === 'Mute') requestToggleMute();
          }}
        />
      </M.div>

      {elDebug}
      {elMask}
    </div>
  );
};
