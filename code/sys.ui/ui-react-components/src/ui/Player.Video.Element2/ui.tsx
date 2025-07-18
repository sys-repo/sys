import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PlayerControls } from '../Player.Video.Controls/mod.ts';

import { type t, Color, css, M } from './common.ts';
import { useAutoplay } from './use.AutoPlay.ts';
import { useControlsVisible } from './use.ControlsVisible.ts';

export const VideoElement2: React.FC<t.VideoElement2Props> = (props) => {
  const {
    src,
    poster,
    autoPlay = true,
    muted: mutedProp = false,
    loop = false,
    aspectRatio = '16/9',
    borderRadius = 0,
    debug = false,
    onEnded,
  } = props;

  /**
   * Refs:
   */
  const videoRef = useRef<HTMLVideoElement>(null);

  /**
   * Hooks (state):
   */
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [pointerOver, setOver] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [wantPlay, setWantPlay] = useState(autoPlay);
  useAutoplay({ src, wantPlay, mutedProp, setWantPlay, videoRef });

  /* ReadyState: 0..4 – sampled every render via ref: */
  const rs = videoRef.current?.readyState ?? 0;
  const paused = videoRef.current?.paused ?? true;

  /* Derived UI flags: */
  const canPlay = rs >= 3; // HAVE_FUTURE_DATA
  const playing = !paused;
  const spinning = wantPlay && !playing && !canPlay;
  const controlsUp = useControlsVisible({ playing, canPlay, pointerOver });

  /**
   * Effect: Sync time/duration off the media element
   */
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onTime = () => setTime(el.currentTime);
    const onDur = () => setDuration(el.duration);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onDur);
    el.addEventListener('durationchange', onDur);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onDur);
      el.removeEventListener('durationchange', onDur);
    };
  }, [src]);

  /**
   * Handlers:
   */
  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      setWantPlay(true);
      void el.play();
    } else {
      setWantPlay(false);
      el.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const el = videoRef.current;
    if (el) el.muted = !el.muted;
  }, []);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      aspectRatio,
      borderRadius,
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
    >
      <video
        ref={videoRef}
        className={styles.video.class}
        src={src}
        poster={poster}
        preload={'auto'}
        muted={mutedProp}
        loop={loop}
        playsInline
        disablePictureInPicture
        onClick={togglePlay}
        onEnded={onEnded}
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
          muted={videoRef.current?.muted ?? mutedProp}
          duration={duration}
          currentTime={time}
          buffering={spinning}
          onClick={(e) => {
            if (e.button === 'Play') togglePlay();
            if (e.button === 'Mute') toggleMute();
          }}
          onSeeking={({ currentTime, complete }) => {
            setSeeking(!complete);
            if (complete && videoRef.current) {
              videoRef.current.currentTime = currentTime;
              if (wantPlay) void videoRef.current.play();
            }
          }}
        />
      </M.div>

      {debug && (
        <div
          className={styles.debug.class}
        >{`ready-state:${rs} play:${playing} spin:${spinning}`}</div>
      )}

      {/* optional vignette mask */}
      {/* <FadeMask mask="soft" theme={theme.name} /> */}
    </div>
  );
};
