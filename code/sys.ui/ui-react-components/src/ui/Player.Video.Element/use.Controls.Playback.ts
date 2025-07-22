import React, { useEffect, useState } from 'react';

import { type t, rx } from './common.ts';
import { Wrangle } from './u.ts';

type P = Pick<t.VideoElementProps, 'src' | 'playing' | 'muted' | 'defaultMuted' | 'crop'>;

export function usePlaybackControls(videoRef: React.RefObject<HTMLVideoElement>, props: P) {
  const { src, playing, muted, defaultMuted } = props;
  const crop = Wrangle.crop(props.crop);
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

    // Muted:
    if (muted !== undefined && el.muted !== muted) {
      el.muted = muted;
    } else if (muted === undefined && defaultMuted !== undefined) {
      // One-time init when "uncontrolled".
      el.muted = defaultMuted;
    }

    // Play/Pause:
    const syncPlayback = () => {
      if (playing && el.paused) void el.play().catch(() => {});
      if (!playing && !el.paused) el.pause();
    };
    syncPlayback(); // Immediate sync.

    if (playing) {
      /**
       * If play was requested but the media isn't ready,
       * try again on the first 'canplay' event.
       */
      const { dispose, signal } = rx.abortable();
      el.addEventListener('canplay', syncPlayback, { once: true, signal });
      return dispose;
    }
  }, [videoRef.current, src, playing, muted, defaultMuted, crop?.start]);

  /**
   * Handlers:
   */
  const onSeeking = (e: t.PlayerControlSeekChange) => {
    const el = videoRef.current;
    const relativeTime = e.currentTime; // 0..(cropped duration).
    setSeeking(e.complete ? undefined : { currentTime: relativeTime });

    if (!el) return;

    // Always write back into the real <video> so you scrub immediately:
    el.currentTime = relativeTime + cropStart;

    // When the drag is complete, if uncontrolled and it was playing, resume:
    if (e.complete && isUncontrolled && !el.paused) void el.play().catch(() => {});
  };

  /**
   * API:
   */
  return { seeking, onSeeking } as const;
}
