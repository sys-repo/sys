import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PlayerControls } from '../Player.Video.Controls/mod.ts';

import { type t, Color, css, M, READY_STATE } from './common.ts';
import { useAutoplay } from './use.AutoPlay.ts';
import { useControlsVisible } from './use.ControlsVisible.ts';

export const VideoElement2: React.FC<t.VideoElement2Props> = (props) => {
  const {
    src,
    poster,
    loop = false,
    aspectRatio = '16/9',
    cornerRadius = 0,
    debug = false,
    jumpTo,

    // Controlled playback + mute:
    playing: playingProp,
    autoPlay = true,
    muted: mutedProp,
    defaultMuted = props.muted ?? false, // ← back-compat bridge.

    onPlayingChange,
    onMutedChange,
    onEnded,
  } = props as t.VideoElement2Props; // ← explicit cast in case caller passes legacy props.

  /**
   * Refs:
   */
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldAutoplayRef = React.useRef(true);

  /**
   * Local UI state (NOT authoritative playback state):
   */
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
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
  const rs = el?.readyState ?? 0;
  const elPaused = el?.paused ?? true;
  const elMuted = el?.muted ?? mutedProp ?? defaultMuted;
  const canPlay = rs >= READY_STATE.HAVE_FUTURE_DATA;
  const playing = !elPaused;
  const autoplayEnabled = shouldAutoplayRef.current && autoPlay && playingProp !== true;

  /**
   * Spinner logic: show while an autoplay attempt is pending and media not yet playing.
   */
  const spinning = autoplayPendingRef.current && !playing && !canPlay;

  /**
   * Controls visibility.
   */
  const controlsUp = useControlsVisible({
    playing,
    canPlay,
    pointerOver,
  });

  /**
   * Effect: Sync time/duration from media element.
   */
  useEffect(() => {
    if (!el) return;

    const onTime = () => setTime(el.currentTime);
    const onDur = () => setDuration(Number.isFinite(el.duration) ? el.duration : 0);

    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onDur);
    el.addEventListener('durationchange', onDur);

    // init
    onDur();
    onTime();

    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onDur);
      el.removeEventListener('durationchange', onDur);
    };
  }, [src, el]);

  /**
   * Effect: Wire media events -> outward change notifications.
   */
  useEffect(() => {
    if (!el) return;

    const emitPlaying = (value: boolean, reason: t.MediaCtxReason) =>
      onPlayingChange?.({ playing: value, ctx: { reason } });

    const emitMuted = (value: boolean, reason: t.MediaCtxReason) =>
      onMutedChange?.({ muted: value, ctx: { reason } });

    const handlePlay = () => {
      autoplayPendingRef.current = false;
      emitPlaying(true, 'element-event');
    };
    const handlePause = () => emitPlaying(false, 'element-event');
    const handleEnded = () => {
      emitPlaying(false, 'media-ended');
      onEnded?.({ ctx: { reason: 'ended' } });
    };
    const handleVolume = () => emitMuted(el.muted, 'element-event');

    el.addEventListener('play', handlePlay);
    el.addEventListener('playing', handlePlay);
    el.addEventListener('pause', handlePause);
    el.addEventListener('ended', handleEnded);
    el.addEventListener('volumechange', handleVolume);

    return () => {
      el.removeEventListener('play', handlePlay);
      el.removeEventListener('playing', handlePlay);
      el.removeEventListener('pause', handlePause);
      el.removeEventListener('ended', handleEnded);
      el.removeEventListener('volumechange', handleVolume);
    };
  }, [el, onEnded, onPlayingChange, onMutedChange]);

  /**
   * Effect: Apply controlled props to element.
   *         (Runs whenever caller changes `playingProp`/`mutedProp`.)
   */
  useEffect(() => {
    if (!el) return;

    // Muted
    if (mutedProp !== undefined && el.muted !== mutedProp) {
      el.muted = mutedProp;
    } else if (mutedProp === undefined && defaultMuted !== undefined) {
      // one-time init for uncontrolled
      el.muted = defaultMuted;
    }

    // Play/Pause
    if (playingProp !== undefined) {
      if (playingProp && el.paused) {
        void el.play().catch(() => {
          /* let autoplay hook retry; emit fails via hook */
        });
      }
      if (!playingProp && !el.paused) el.pause();
    }
  }, [el, playingProp, mutedProp, defaultMuted]);

  /**
   * Effect: Seek → respond to external jump-to commands.
   */
  useEffect(() => {
    if (!videoRef.current || !jumpTo) return;

    const el = videoRef.current;
    el.currentTime = jumpTo.second;

    if (jumpTo.play) {
      if (el.paused) void el.play();
    } else {
      if (!el.paused) el.pause();
    }
  }, [jumpTo]);

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
          if (!el.paused) {
            void el.play();
          }
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
    video: css({ width: '100%', height: '100%', objectFit: 'cover' }),
    controls: css({ Absolute: [null, 0, null, 0] }),
    debug: css({
      Absolute: [6, null, null, 6],
      fontSize: 11,
      color: Color.alpha(Color.DARK, 0.6),
      backgroundColor: Color.alpha(Color.WHITE, 0.5),
      Padding: [1, 5],
      borderRadius: 2,
    }),
  };

  return (
    <div
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
        // Note: don't pass `muted` or `autoPlay` here; we manage via effects.
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
          playing={playing}
          muted={elMuted}
          duration={duration}
          currentTime={time}
          buffering={spinning}
          onClick={(e) => {
            if (e.button === 'Play') requestTogglePlay();
            if (e.button === 'Mute') requestToggleMute();
          }}
          onSeeking={handleSeeking}
        />
      </M.div>

      {debug && (
        <div className={styles.debug.class}>
          {`ready-state:${rs}, play:${playing}, seek:${seeking}, src:${src?.slice(-8) || ''}`}
        </div>
      )}

      {/* <FadeMask mask='soft' theme={theme.name} /> */}
    </div>
  );
};
