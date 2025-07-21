import React, { useEffect } from 'react';
import { type t } from './common.ts';

type P = Pick<
  t.VideoElementProps,
  'onBufferedChange' | 'onBufferingChange' | 'onPlayingChange' | 'onMutedChange' | 'onEnded'
>;

/**
 * Effect: Wire media events -> outward change notifications.
 */
export function useMediaEvents(
  videoRef: React.RefObject<HTMLVideoElement>,
  autoplayPendingRef: React.MutableRefObject<boolean>,
  props: P,
) {
  const { onEnded, onPlayingChange, onMutedChange, onBufferingChange } = props;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const emitBuffering = (value: boolean, reason: t.MediaCtxReason) =>
      onBufferingChange?.({ buffering: value, ctx: { reason } });

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

    const handleWaiting = () => emitBuffering(true, 'element-event');
    const handleStalled = () => emitBuffering(true, 'element-event');
    const handlePlaying = () => emitBuffering(false, 'element-event');
    const handleCanPlay = () => emitBuffering(false, 'element-event');

    el.addEventListener('play', handlePlay);
    el.addEventListener('playing', handlePlay);
    el.addEventListener('pause', handlePause);
    el.addEventListener('ended', handleEnded);
    el.addEventListener('volumechange', handleVolume);
    el.addEventListener('waiting', handleWaiting);
    el.addEventListener('stalled', handleStalled);
    el.addEventListener('canplay', handleCanPlay);

    return () => {
      el.removeEventListener('play', handlePlay);
      el.removeEventListener('playing', handlePlay);
      el.removeEventListener('pause', handlePause);
      el.removeEventListener('ended', handleEnded);
      el.removeEventListener('volumechange', handleVolume);
      el.removeEventListener('waiting', handleWaiting);
      el.removeEventListener('stalled', handleStalled);
      el.removeEventListener('canplay', handleCanPlay);
    };
  }, [videoRef.current, autoplayPendingRef]);
}
