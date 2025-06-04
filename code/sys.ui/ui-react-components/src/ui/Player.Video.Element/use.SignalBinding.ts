import React from 'react';
import { type t, Dom, Signal, Time } from './common.ts';

/**
 * Manages keeping the <VideoPlayer> component in-sync
 * with the current state of the Signals API.
 */
export function useSignalBinding(args: {
  video?: t.VideoPlayerSignals;
  videoRef: React.RefObject<HTMLVideoElement>;
  isSeeking: boolean;
}) {
  const { videoRef, video, isSeeking } = args;
  const instance = video?.instance;
  const p = video?.props;

  /**
   * Action: play/pause the <video> element.
   */
  function play(play = true) {
    const el = videoRef.current;
    if (!el) return;

    if (!Dom.UserHas.interacted) {
      if (p) p.playing.value = false;
      const detail = 'User has not interacted with the window yet. (no action taken)';
      console.info(`🫵 Cannot ${play ? 'play' : 'pause'} the video. ${detail}`);
      return;
    }

    if (play) el.play();
    if (!play) el.pause();
  }

  /**
   * Listen: <video> element events (⚡️).
   */
  React.useEffect(() => {
    const life = new AbortController();
    const video = videoRef.current;
    if (!video) return;

    const updateDuration = () => {
      if (!p) return;
      if (p.duration.value !== video.duration) p.duration.value = video.duration;
    };
    const onReadyChange = () => {
      if (!p) return;
      p.ready.value = video.readyState === 4;
    };
    const onMetadata = () => {
      updateDuration();
      onReadyChange();
    };

    const onPlay = () => {
      if (!p || isSeeking) return;
      if (!(p.playing.value ?? false)) p.playing.value = true;
    };
    const onPause = () => {
      if (!p || isSeeking) return;
      if (p.playing.value ?? false) p.playing.value = false;
    };
    const onTimeUpdate = () => {
      if (!p) return;
      p.currentTime.value = video.currentTime;
    };

    const onBufferingStart = () => {
      // NB: Called when seeking or playback stalls.
      if (!p) return;
      p.buffering.value = true;
    };

    const onBufferingEnd = () => {
      // NB: Called when resumed playing after buffering.
      if (!p) return;
      p.buffering.value = false;
    };

    const onProgress = () => {
      if (!p) return;
      if (video.buffered.length > 0 && video.duration > 0) {
        // NB: get the last buffered range's end‐time.
        const secs = video.buffered.end(video.buffered.length - 1);
        p.buffered.value = Math.min(secs, video.duration);
      }
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

    // Events: buffering & progress:
    video.addEventListener('seeking', onBufferingStart, life);
    video.addEventListener('waiting', onBufferingStart, life);
    video.addEventListener('playing', onBufferingEnd, life);
    video.addEventListener('seeked', onBufferingEnd, life);
    video.addEventListener('progress', onProgress, life);

    onReadyChange();
    return () => void life.abort();
  }, [videoRef, instance, isSeeking, p?.src]);

  /**
   * Effect: Auto-Play.
   */
  React.useEffect(() => {
    const time = Time.until();
    const autoPlay = p?.autoPlay.value;

    // NB: after delay to prevent race condition with other callers during initial load.
    if (autoPlay) time.delay(0, () => play(true));
    return time.dispose;
  }, []);

  /**
   * Effect: seeking behavior.
   */
  React.useEffect(() => {
    const video = videoRef.current;
    if (isSeeking === true) video?.pause();
  }, [isSeeking, instance]);

  /**
   * Signal: isPlaying
   */
  Signal.useEffect(() => {
    const video = videoRef.current;
    const isPlaying = p?.playing.value ?? false;
    if (!video) return;

    if (isPlaying && video.paused) play(true);
    if (!isPlaying && !video.paused) play(false);
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
}
