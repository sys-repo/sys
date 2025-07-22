import React, { useEffect, useState } from 'react';

import { type t, rx } from './common.ts';
import { resolveCropEnd, Wrangle } from './u.ts';

type P = Pick<t.VideoElementProps, 'src' | 'crop' | 'onTimeUpdate' | 'onDurationChange'>;

export function useMediaProgress(videoRef: React.RefObject<HTMLVideoElement>, props: P) {
  const { src, onDurationChange, onTimeUpdate } = props;
  const crop = Wrangle.crop(props.crop);
  const cropStart = crop?.start ?? 0;
  const rawEnd = crop?.end;

  const [currentTime, setCurrentTime] = useState<t.Secs>(0);
  const [duration, setDuration] = useState<t.Secs>(0);

  // Reset whenever `src` or `crop` bounds change:
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    onTimeUpdate?.({ secs: 0 });
    onDurationChange?.({ secs: 0 });
  }, [src, cropStart, rawEnd]);

  // Sync against the actual <video> element:
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const onTime = () => {
      // Derive the underlying duration and absolute end:
      const rawDur = Number.isFinite(el.duration) ? el.duration : 0;
      const absEnd = resolveCropEnd(rawEnd, rawDur);
      const max = absEnd - cropStart;

      // Compute relative position, clamped into [0..max]:
      let secs = el.currentTime - cropStart;
      secs = Math.max(0, Math.min(secs, max));

      // Update state and alert listeners:
      setCurrentTime(secs);
      onTimeUpdate?.({ secs });
    };

    const onDuration = () => {
      const rawDur = Number.isFinite(el.duration) ? el.duration : 0;
      const absEnd = resolveCropEnd(rawEnd, rawDur);
      const secs = Math.max(0, absEnd - cropStart);

      setDuration(secs);
      onDurationChange?.({ secs });
    };

    // Initialize immediately:
    onDuration();
    onTime();

    // Attach listeners:
    const { dispose, signal } = rx.abortable();
    el.addEventListener('timeupdate', onTime, { signal });
    el.addEventListener('loadedmetadata', onDuration, { signal });
    el.addEventListener('durationchange', onDuration, { signal });

    return dispose;
  }, [videoRef.current, src, cropStart, rawEnd]);

  return { currentTime, duration } as const;
}
