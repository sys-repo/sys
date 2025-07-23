import { useEffect, useState } from 'react';
import { type t, rx } from './common.ts';

export function useMediaProgress(
  videoRef: React.RefObject<HTMLVideoElement>,
  props: Pick<t.VideoElementProps, 'src' | 'onTimeUpdate' | 'onDurationChange'>,
) {
  const { src, onTimeUpdate, onDurationChange } = props;

  /**
   * Hooks:
   */
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  /**
   * Effect: Reset when `src` or `crop` changes.
   */
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    onTimeUpdate?.({ secs: 0 });
    onDurationChange?.({ secs: 0 });
  }, [src]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const updateTime = () => {
      const fullDuration = Number.isFinite(el.duration) ? el.duration : 0;
      setDuration(fullDuration);
      onDurationChange?.({ secs: fullDuration });

      let secs = el.currentTime;
      secs = Math.max(0, Math.min(secs, fullDuration));


      setCurrentTime(secs);
      onTimeUpdate?.({ secs });
    };

    const { dispose, signal } = rx.abortable();
    el.addEventListener('loadedmetadata', updateTime, { signal });
    el.addEventListener('durationchange', updateTime, { signal });
    el.addEventListener('timeupdate', updateTime, { signal });

    updateTime();
    return dispose;
  }, [videoRef, src, onTimeUpdate, onDurationChange]);

  /**
   * API:
   */
  return { currentTime, duration } as const;
}
