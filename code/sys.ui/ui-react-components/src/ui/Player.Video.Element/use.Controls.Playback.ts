import React, { useEffect, useState } from 'react';
import { type t, rx } from './common.ts';
import { Crop } from './u.ts';

type P = Pick<t.VideoElementProps, 'src' | 'playing' | 'muted' | 'defaultMuted' | 'crop'>;

export function usePlaybackControls(videoRef: React.RefObject<HTMLVideoElement>, props: P) {
  const { src, playing, muted, defaultMuted } = props;
  const crop = Crop.wrangle(props.crop);
  const cropStart = crop?.start ?? 0;
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
  }, [videoRef.current, src, playing, muted, defaultMuted, cropStart]);

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
    el.currentTime = e.currentTime + cropStart;
  };

  /**
   * API:
   */
  return { seeking, onSeeking } as const;
}
