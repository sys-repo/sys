import React, { useEffect, useState } from 'react';
import { type t } from './common.ts';

type P = Pick<t.VideoElementProps, 'src' | 'onTimeUpdate' | 'onDurationChange'>;

export function useMediaProgress(videoRef: React.RefObject<HTMLVideoElement>, props: P) {
  const { src, onDurationChange, onTimeUpdate } = props;

  /**
   * Hooks:
   */
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  /**
   * Effect: Sync time/duration from media element.
   */
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const onTime = () => {
      setTime(el.currentTime);
      onTimeUpdate?.({ secs: el.currentTime });
    };
    const onDur = () => {
      const secs = Number.isFinite(el.duration) ? el.duration : 0;
      setDuration(secs);
      onDurationChange?.({ secs });
    };

    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onDur);
    el.addEventListener('durationchange', onDur);

    // Init:
    onDur();
    onTime();

    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onDur);
      el.removeEventListener('durationchange', onDur);
    };
  }, [videoRef.current, src]);

  /**
   * Effect: Reset progress when source changes.
   */
  useEffect(() => {
    setTime(0);
    setDuration(0);
    onTimeUpdate?.({ secs: 0 });
    onDurationChange?.({ secs: 0 });
  }, [src]);

  /**
   * API:
   */
  return { time, duration } as const;
}
