import React, { useEffect, useRef } from 'react';
import { type t } from './common.ts';

export function useSeekCmd(
  videoRef: React.RefObject<HTMLVideoElement>,
  duration: t.Secs,
  cmd?: t.VideoPlayerSeekCmd,
) {
  const lastCmd = useRef<t.VideoPlayerSeekCmd>();

  /**
   * Effect: seek/jump behavior.
   */
  useEffect(() => {
    if (!cmd) return; // nothing to do
    if (cmd === lastCmd.current) return; // already processed
    lastCmd.current = cmd; // mark as handled

    const el = videoRef.current;
    if (!el) return;

    /**
     * Seek:
     */
    let secs = cmd.second;
    if (secs < 0) secs = duration + secs; // support negative index
    secs = Math.max(0, Math.min(duration, secs)); // clamp
    el.currentTime = secs;

    /**
     * Play / pause
     */
    if (cmd.play === undefined) return; // leave state unchanged
    if (cmd.play && el.paused) void el.play().catch(() => {});
    if (!cmd.play && !el.paused) el.pause();
  }, [cmd, duration, videoRef]);
}
