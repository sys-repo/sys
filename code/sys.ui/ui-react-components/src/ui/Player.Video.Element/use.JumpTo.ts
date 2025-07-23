import { useEffect, useRef } from 'react';
import { type t } from './common.ts';

export function useJumpTo(
  videoRef: React.RefObject<HTMLVideoElement>,
  duration: t.Secs,
  jumpTo?: t.VideoPlayerSeekCmd,
) {
  const last = useRef<t.VideoPlayerSeekCmd>();

  useEffect(() => {
    if (!jumpTo || jumpTo === last.current) return;
    last.current = jumpTo;

    const el = videoRef.current;
    if (!el) return;

    let sec = jumpTo.second;
    sec = Math.max(0, Math.min(sec, duration));
    el.currentTime = sec;

    // play/pause
    if (jumpTo.play === true) void el.play().catch(() => {});
    if (jumpTo.play === false) el.pause();
  }, [videoRef, duration, jumpTo]);
}
