import React, { useEffect, useRef } from 'react';

import { type t } from './common.ts';
import { Crop } from './u.ts';

export function useSeekCmd(
  videoRef: React.RefObject<HTMLVideoElement>,
  duration: t.Secs,
  crop?: t.VideoCropRange,
  jumpTo?: t.VideoPlayerSeekCmd,
) {
  const lastCmd = useRef<t.VideoPlayerSeekCmd>();

  /**
   * Effect: seek/jump behavior.
   */
  useEffect(() => {
    if (!jumpTo) return; // nothing to do
    if (jumpTo === lastCmd.current) return; // already processed
    lastCmd.current = jumpTo; // mark as handled

    const el = videoRef.current;
    if (!el) return;

    /**
     * Seek:
     */
    const cropStart = crop?.start ?? 0;
    const cropEnd = Crop.resolveEnd(crop?.end, duration);
    const rawSecs = Crop.resolveEnd(jumpTo.second, duration);
    let secs = rawSecs + cropStart;
    if (secs < cropStart) secs = cropStart;
    if (secs > cropEnd) secs = cropEnd;

    el.currentTime = secs;

    /**
     * Play / Pause:
     */
    if (jumpTo.play === undefined) return; // NB: leave state unchanged.
    if (jumpTo.play && el.paused) void el.play().catch(() => {});
    if (!jumpTo.play && !el.paused) el.pause();
  }, [videoRef, jumpTo, crop, duration]);
}
