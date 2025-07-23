import React, { useEffect, useState } from 'react';
import { type t, rx } from './common.ts';

export function usePlaybackControls(
  videoRef: React.RefObject<HTMLVideoElement>,
  props: Pick<t.VideoElementProps, 'src' | 'playing' | 'muted' | 'defaultMuted' | 'crop'>,
) {
  const { src, playing, muted, defaultMuted } = props;
  const isUncontrolled = playing === undefined;

  /**
   * Hooks:
   */
  const [seeking, setSeeking] = useState<{ currentTime: t.Secs }>();

  /**
   * Effect: Apply controlled props to element.
   *        (Runs whenever caller changes `playing/muted` prop.)
   */
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (playing === undefined) return; // uncontrolled → let useAutoplay handle playing.

    // Controlled → sync mute:
    if (muted !== undefined && el.muted !== muted) {
      el.muted = muted;
    } else if (muted === undefined && defaultMuted !== undefined) {
      el.muted = defaultMuted;
    }

    // Controlled → sync play/pause:
    const syncPlayback = () => {
      if (playing && el.paused) void el.play().catch(() => {});
      if (!playing && !el.paused) el.pause();
    };
    syncPlayback();

    // If not yet ready, retry on `canplay`:
    if (playing) {
      const { dispose, signal } = rx.abortable();
      el.addEventListener('canplay', syncPlayback, { once: true, signal });
      return dispose;
    }
  }, [videoRef.current, src, playing, muted, defaultMuted]);

  /**
   * Handlers:
   */
  const onSeeking = (e: t.PlayerControlSeekChange) => {
    const el = videoRef.current;
    if (!el) return;

    // Always clear `seeking` on completion.
    if (e.complete) {
      setSeeking(undefined);
      if (isUncontrolled && !el.paused) {
        void el.play().catch(() => {});
      }
    } else {
      // While actively dragging, show the drag position:
      setSeeking({ currentTime: e.currentTime });
    }

    // Scrub the video immediately, regardless of drag state:
    el.currentTime = e.currentTime;
  };

  /**
   * API:
   */
  return { seeking, onSeeking } as const;
}
