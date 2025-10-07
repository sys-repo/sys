import React, { useEffect, useState } from 'react';
import { type t, Rx } from './common.ts';

export function usePlaybackControls(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  lens: t.VideoCropLens,
  props: Pick<t.VideoElementProps, 'src' | 'playing' | 'muted' | 'defaultMuted' | 'crop'>,
) {
  const { src, playing, muted, defaultMuted } = props;
  const isUncontrolled = playing === undefined;

  /**
   * Hooks:
   */
  const [seeking, setSeeking] = useState<{ currentTime: t.Secs }>();

  /**
   * Effect: nuke seeking state on crop change.
   */
  useEffect(() => void setSeeking(undefined), [props.crop]);

  /**
   * Effect: Apply controlled props to element.
   *        (Runs whenever caller changes `playing/muted` prop.)
   */
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (playing === undefined) return; // uncontrolled → let `useAutoplay` handle playing.

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
      const { dispose, signal } = Rx.abortable();
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

    // Value coming in via event is cropped-space:
    const croppedSecs = Math.max(0, e.currentTime);
    const fullSecs = lens.toFull(croppedSecs);

    // Finalize new time settings on drag-complete:
    if (e.complete) {
      el.currentTime = fullSecs;
      setSeeking(undefined);
      if (isUncontrolled && !el.paused) void el.play().catch(() => {});
      return;
    }

    // Update seeking slider state while dragging:
    setSeeking({ currentTime: croppedSecs });
    el.currentTime = fullSecs;
  };

  /**
   * API:
   */
  return { seeking, onSeeking } as const;
}
