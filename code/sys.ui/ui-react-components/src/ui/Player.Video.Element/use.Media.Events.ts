import React, { useEffect, useRef } from 'react';
import { type t, rx } from './common.ts';

type R = t.VideoPlayerEventReason;
type P = t.VideoElementProps;

/**
 * Wire media events → outward change notifications.
 */
export function useMediaEvents(
  videoRef: React.RefObject<HTMLVideoElement>,
  autoplayPendingRef: React.MutableRefObject<boolean>,
  props: Pick<P, 'onBufferingChange' | 'onPlayingChange' | 'onMutedChange' | 'onEnded'>,
) {
  const { onBufferingChange, onPlayingChange, onMutedChange, onEnded } = props;

  /**
   * Refs:
   */
  const lastPlaying = useRef<boolean>();

  /**
   * Effect:
   */
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const firePlaying = (playing: boolean, reason: R) => {
      if (lastPlaying.current === playing) return;
      lastPlaying.current = playing;
      onPlayingChange?.({ playing, reason });
    };

    const fireMuted = (muted: boolean, reason: R) => {
      onMutedChange?.({ muted, reason });
    };

    const fireBuffering = (buffering: boolean, reason: R) => {
      onBufferingChange?.({ buffering, reason });
    };

    const onPlay = () => {
      autoplayPendingRef.current = false;
      firePlaying(true, 'video-element-event');
    };

    const onPause = () => firePlaying(false, 'video-element-event');
    const onEndedHandler = () => {
      firePlaying(false, 'media-ended');
      onEnded?.({ reason: 'ended' });
    };
    const onVolume = () => fireMuted(el.muted, 'video-element-event');
    const onBufferStart = () => fireBuffering(true, 'video-element-event');
    const onBufferEnd = () => fireBuffering(false, 'video-element-event');

    const { dispose, signal } = rx.abortable();
    el.addEventListener('playing', onPlay, { signal });
    el.addEventListener('pause', onPause, { signal });
    el.addEventListener('ended', onEndedHandler, { signal });
    el.addEventListener('volumechange', onVolume, { signal });
    el.addEventListener('waiting', onBufferStart, { signal });
    el.addEventListener('stalled', onBufferStart, { signal });
    el.addEventListener('canplay', onBufferEnd, { signal });

    return dispose;
  }, [videoRef, autoplayPendingRef, onBufferingChange, onPlayingChange, onMutedChange, onEnded]);
}
