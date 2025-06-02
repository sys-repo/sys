import React from 'react';
import { type t, Signal } from './common.ts';

/**
 * Manages keeping the <VideoPlayer> component in-sync
 * with the current state of the Signals API.
 */
export function useSignalBinding(
  videoRef: React.RefObject<HTMLVideoElement>,
  signals?: t.VideoPlayerSignals,
) {
  const p = signals?.props;
  const instance = signals?.instance;

  const [readyState, setReadyState] = React.useState(0);

  /**
   * Listen: <video> element events.
   */
  React.useEffect(() => {
    const life = new AbortController();
    const video = videoRef.current;
    if (!video) return;

    const updateDuration = () => {
      if (!p) return;
      if (p.duration.value !== video.duration) p.duration.value = video.duration;
    };

    const onReadyChange = () => setReadyState(video.readyState);
    const onMetadata = () => {
      updateDuration();
      onReadyChange();
    };

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

    // Events: ready-state:
    video.addEventListener('loadedmetadata', onMetadata, life);
    video.addEventListener('canplay', onReadyChange, life);
    video.addEventListener('canplaythrough', onReadyChange, life);
    video.addEventListener('durationchange', updateDuration, life);

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
   * Handle: jumpTo (aka. "seek").
   */
  Signal.useEffect(() => {
    const video = videoRef.current;
    const jumpTo = p?.jumpTo.value;
    p?.ready.value;

    if (video && p) {
      if (typeof jumpTo?.second === 'number') {
        video.currentTime = jumpTo.second;
        if (jumpTo.play) video.play();
        if (!jumpTo.play) video.pause();
        p.jumpTo.value = undefined; // NB: reset after for next call.
      }
    }
  });

  /**
   * API:
   */
  return { readyState } as const;
}
