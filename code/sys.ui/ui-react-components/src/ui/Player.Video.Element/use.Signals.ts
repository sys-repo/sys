import React from 'react';
import { type t, Signal } from './common.ts';

/**
 * Manages keeping the <VideoPlayer> component in sync with
 * the current state of the Signals API.
 */
export function useSignals(
  videoRef: React.RefObject<HTMLVideoElement>,
  signals?: t.VideoPlayerSignals,
) {
  const instance = signals?.instance;
  const p = signals?.props;

  const [readyState, setReadyState] = React.useState(0);

  /**
   * Listen: <video> element events.
   */
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onReadyChange = () => setReadyState(video.readyState);
    const onPlay = () => {
      if (!p) return;
      if (!(p.playing.value ?? false)) p.playing.value = true;
    };
    const onPause = () => {
      if (!p) return;
      if (p.playing.value ?? false) p.playing.value = false;
    };
    const onTimeUpdate = () => {
      if (!p) return;
      p.currentTime.value = video.currentTime;
    };

    const life = new AbortController();

    // Events: ready-state:
    video.addEventListener('loadedmetadata', onReadyChange, life);
    video.addEventListener('canplay', onReadyChange, life);
    video.addEventListener('canplaythrough', onReadyChange, life);

    // Events: playing:
    video.addEventListener('play', onPlay, life);
    video.addEventListener('pause', onPause, life);
    video.addEventListener('timeupdate', onTimeUpdate, life);

    return () => void life.abort();
  }, [videoRef, instance]);

  /**
   * Effect: sync ready-state.
   */
  React.useEffect(() => {
    if (p && readyState === 4 && !p?.ready.value) p.ready.value = true;
  }, [readyState, instance]);

  /**
   * Signal: isPlaying
   */
  Signal.useEffect(() => {
    const video = videoRef.current;
    const isPlaying = p?.playing.value ?? false;
    if (!video) return;
    if (isPlaying && video.paused) video.play();
    if (!isPlaying && !video.paused) video.pause();
  });

  /**
   * API:
   */
  return { readyState } as const;
}
