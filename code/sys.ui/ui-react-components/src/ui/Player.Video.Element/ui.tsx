import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PlayerControls } from '../Player.Video.Controls/mod.ts';

import { type t, Color, css, D, M, READY_STATE, useSizeObserver } from './common.ts';
import { Debug } from './ui.Debug.tsx';
import { FadeMask } from './ui.FadeMask.tsx';
import { useAutoplay } from './use.AutoPlay.ts';
import { useBuffered } from './use.Buffered.ts';
import { useControlsVisible } from './use.ControlsVisible.ts';
import { useMediaEvents } from './use.MediaEvents.ts';
import { useMediaProgress } from './use.MediaProgress.ts';
import { usePlaybackControls } from './use.PlaybackControls.ts';
import { useScale } from './use.Scale.ts';
import { useSeekCmd } from './use.SeekCmd.ts';

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

    // Controlled playback + mute:
    playing: playingProp,
    autoPlay = true,
    muted: mutedProp,
    defaultMuted = props.muted ?? false, // ← back-compat bridge.

    onPlayingChange,
    onMutedChange,
  } = props as t.VideoElementProps; // ← explicit cast in case caller passes legacy props.

  /**
   * Refs:
   */
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldAutoplayRef = React.useRef(true);

  /**
   * Local UI state (NOT authoritative playback state):
   */
  const [pointerOver, setOver] = useState(false);
  const [seeking, setSeeking] = useState(false);

  /**
   * Track whether we are in an autoplay attempt (for spinner UX).
   * Cleared when element enters playing or we give up.
   */
  const autoplayPendingRef = useRef(false);
  useEffect(() => {
    shouldAutoplayRef.current = true;
    autoplayPendingRef.current = false;
  }, [src]);

  /**
   * Resolve current element state (sampled).
   */
  const el = videoRef.current;
  const rs = (el?.readyState ?? 0) as t.NumberMediaReadyState;
  const elPaused = el?.paused ?? true;
  const elMuted = el?.muted ?? mutedProp ?? defaultMuted;
  const canPlay = rs >= READY_STATE.HAVE_FUTURE_DATA;
  const playing = !elPaused && canPlay;
  const autoplayEnabled = shouldAutoplayRef.current && autoPlay && playingProp !== true;

  /**
   * Spinner logic: show while an autoplay attempt is pending and media not yet playing.
   */
  const NOT_READY = autoplayPendingRef.current || rs < READY_STATE.HAVE_CURRENT_DATA;
  const READY = !NOT_READY;

  /**
   * Hooks:
   */
  const controlsUp = useControlsVisible({ playing, canPlay, pointerOver });
  const progress = useMediaProgress(videoRef, props);
  const size = useSizeObserver();
  const scale = useScale(size, props.scale);
  useBuffered(videoRef, props);
  useMediaEvents(videoRef, autoplayPendingRef, props);
  useSeekCmd(videoRef, progress.duration, props.jumpTo);
  usePlaybackControls(videoRef, props);

  /**
   * Autoplay (only when playback is uncontrolled by `playingProp`):
   * - Intent derived from `autoPlay` (initial true by default).
   * - Hook will request external state via callbacks.
   */
  useAutoplay({
    enabled: autoplayEnabled,
    src,
    muted: mutedProp ?? defaultMuted ?? false,
    videoRef,
    onStart: () => {
      shouldAutoplayRef.current = false;
      autoplayPendingRef.current = true;
      onPlayingChange?.({ playing: true, ctx: { reason: 'autoplay-start' } });
    },
    onMutedRetry: () => {
      autoplayPendingRef.current = true;
      onMutedChange?.({ muted: true, ctx: { reason: 'autoplay-muted-retry' } });
    },
    onGesturePlay: () => {
      autoplayPendingRef.current = true;
      onPlayingChange?.({ playing: true, ctx: { reason: 'autoplay-gesture' } });
    },
    onGiveUp: () => {
      shouldAutoplayRef.current = false;
      autoplayPendingRef.current = false;
      onPlayingChange?.({ playing: false, ctx: { reason: 'element-event' } });
    },
  });

  /**
   * Handlers (user UI interactions):
   */
  const requestTogglePlay = useCallback(() => {
    const value = !playing;
    onPlayingChange?.({ playing: value, ctx: { reason: 'user-toggle-play' } });
  }, [playing, onPlayingChange]);

  const requestToggleMute = useCallback(() => {
    const value = !elMuted;
    onMutedChange?.({ muted: value, ctx: { reason: 'user-toggle-mute' } });
  }, [elMuted, onMutedChange]);

  /**
   * Seek handler from controls.
   */
  const handleSeeking = useCallback(
    ({ currentTime, complete }: { currentTime: number; complete: boolean }) => {
      setSeeking(!complete);
      if (el && complete) {
        el.currentTime = currentTime;
        // If parent controls playback, they decide whether to resume.
        // If uncontrolled (no playingProp) and element was playing, resume automatically.
        if (playingProp === undefined) {
          if (!el.paused) void el.play();
        }
      }
    },
    [el, playingProp],
  );

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
      readyState={rs}
      seeking={seeking}
      playing={playing}
      src={src}
    />
  );

  // const elSpinning = spinning && <NotReadySpinner theme={theme.name} style={{ Absolute: 0 }} />;
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
          enabled={READY}
          playing={playing}
          muted={elMuted}
          duration={progress.duration}
          currentTime={progress.time}
          buffering={buffering || NOT_READY}
          buffered={buffered}
          //
          onSeeking={handleSeeking}
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
