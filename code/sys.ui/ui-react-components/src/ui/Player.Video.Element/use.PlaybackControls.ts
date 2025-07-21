import React, { useEffect } from 'react';
import { type t, rx } from './common.ts';

type P = Pick<t.VideoElementProps, 'src' | 'playing' | 'muted' | 'defaultMuted'>;

export function usePlaybackControls(videoRef: React.RefObject<HTMLVideoElement>, props: P) {
  const { playing, muted, src, defaultMuted } = props;

  /**
   * Effect: Apply controlled props to element.
   *         (Runs whenever caller changes `playing/muted` prop.)
   */
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    // Muted:
    if (muted !== undefined && el.muted !== muted) {
      el.muted = muted;
    } else if (muted === undefined && defaultMuted !== undefined) {
      // One-time init for uncontrolled.
      el.muted = defaultMuted;
    }

    // Play/Pause:
    const syncPlayback = () => {
      if (playing && el.paused) void el.play().catch(() => {});
      if (!playing && !el.paused) el.pause();
    };
    syncPlayback(); // Immediate sync.

    if (playing) {
      // If play was requested but the media isn't ready,
      // try again on the first 'canplay' event:
      const { dispose, signal } = rx.abortable();
      el.addEventListener('canplay', syncPlayback, { once: true, signal });

      return dispose;
    }
  }, [videoRef.current, src, playing, muted, defaultMuted]);
}
