import React, { useEffect } from 'react';
import { type t, rx } from './common.ts';

type P = Pick<
  t.VideoElementProps,
  'onBufferingChange' | 'onPlayingChange' | 'onMutedChange' | 'onEnded'
>;

/**
 * Wire media events → outward change notifications.
 */
export function useMediaEvents(
  videoRef: React.RefObject<HTMLVideoElement>,
  autoplayPendingRef: React.MutableRefObject<boolean>,
  props: P,
) {
  const { onBufferingChange, onPlayingChange, onMutedChange, onEnded } = props;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    type R = t.VideoPlayerEventReason;
    const firePlaying = (playing: boolean, reason: R) => onPlayingChange?.({ playing, reason });
    const fireMuted = (muted: boolean, reason: R) => onMutedChange?.({ muted, reason });
    const fireBuffering = (buffering: boolean, reason: R) =>
      onBufferingChange?.({ buffering, reason });

    const onPlay = () => {
      autoplayPendingRef.current = false;
      firePlaying(true, 'element-event');
    };

    const onPause = () => firePlaying(false, 'element-event');
    const onEndedHandler = () => {
      firePlaying(false, 'media-ended');
      onEnded?.({ reason: 'ended' });
    };
    const onVolume = () => fireMuted(el.muted, 'element-event');
    const onBufferStart = () => fireBuffering(true, 'element-event');
    const onBufferEnd = () => fireBuffering(false, 'element-event');

    const { dispose, signal } = rx.abortable();
    el.addEventListener('play', onPlay, { signal });
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
