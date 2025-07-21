import React, { useEffect, useState } from 'react';
import { type t, rx } from './common.ts';

type P = Pick<t.VideoElementProps, 'src' | 'onTimeUpdate' | 'onDurationChange'>;

export function useMediaProgress(videoRef: React.RefObject<HTMLVideoElement>, props: P) {
  const { src, onDurationChange, onTimeUpdate } = props;

  /**
   * Hooks:
   */
  const [currentTime, setCurrentTime] = useState<t.Secs>(0);
  const [duration, setDuration] = useState<t.Secs>(0);

  /**
   * Effect: Sync time/duration from media element.
   */
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const onTime = () => {
      setCurrentTime(el.currentTime);
      onTimeUpdate?.({ secs: el.currentTime });
    };
    const onDuration = () => {
      const secs = Number.isFinite(el.duration) ? el.duration : 0;
      setDuration(secs);
      onDurationChange?.({ secs });
    };

    const { dispose, signal } = rx.abortable();
    el.addEventListener('timeupdate', onTime, { signal });
    el.addEventListener('loadedmetadata', onDuration, { signal });
    el.addEventListener('durationchange', onDuration, { signal });

    // Init:
    onDuration();
    onTime();
    return dispose;
  }, [videoRef.current, src]);

  /**
   * Effect: Reset progress when source changes.
   */
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    onTimeUpdate?.({ secs: 0 });
    onDurationChange?.({ secs: 0 });
  }, [src]);

  /**
   * API:
   */
  return { currentTime, duration } as const;
}
