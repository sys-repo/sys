import { useEffect, useRef } from 'react';

import { type t } from './common.ts';
import { Crop } from './u.ts';

export function useJumpTo(
  videoRef: React.RefObject<HTMLVideoElement>,
  duration: number,
  crop?: t.VideoCropRange,
  jumpTo?: t.VideoPlayerSeekCmd,
) {
  const last = useRef<t.VideoPlayerSeekCmd>();

  useEffect(() => {
    if (!jumpTo || jumpTo === last.current) return;
    last.current = jumpTo;

    const el = videoRef.current;
    if (!el) return;

    const start = crop?.start ?? 0;
    const end = Crop.resolveEnd(crop?.end, duration);

    // clamp
    let t = jumpTo.second + start;
    t = Math.max(start, Math.min(t, end));
    el.currentTime = t;

    // play/pause
    if (jumpTo.play === true) void el.play().catch(() => {});
    if (jumpTo.play === false) el.pause();
  }, [videoRef, duration, crop, jumpTo]);
}
