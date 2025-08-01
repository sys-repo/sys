import { useEffect, useMemo, useState } from 'react';
import { type t, rx } from './common.ts';
import { Crop } from './m.Crop.ts';

export function useMediaProgress(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  props: Pick<t.VideoElementProps, 'src' | 'crop' | 'onTimeUpdate' | 'onDurationChange'>,
) {
  const { src, crop, onTimeUpdate, onDurationChange } = props;

  /**
   * Hooks:
   */
  const [currentTimeFull, setCurrentTimeFull] = useState(0);
  const [durationFull, setDurationFull] = useState(0);
  const lens = useMemo<t.VideoCropLens>(() => {
    return Crop.lens(crop, durationFull);
  }, [crop, durationFull]);

  /**
   * Effect: Reset when the `src` or `crop` changes.
   */
  useEffect(() => {
    setCurrentTimeFull(0);
    setDurationFull(0);
    onTimeUpdate?.({ secs: 0 });
    onDurationChange?.({ secs: 0 });
  }, [src, crop]);

  /**
   * Effect: listeners:
   */
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const update = () => {
      const fullDuration = Number.isFinite(el.duration) ? el.duration : 0;
      const nextLens = Crop.lens(crop, fullDuration); // NB: rebuild with fresh duration; memo/state may still be stale this tick.

      setDurationFull(fullDuration);
      onDurationChange?.({ secs: nextLens.duration.cropped });

      const secsFull = Math.max(0, Math.min(el.currentTime, fullDuration));
      const secsCropped = nextLens.toCropped(secsFull);

      setCurrentTimeFull(secsFull);
      onTimeUpdate?.({ secs: secsCropped });
    };

    const { dispose, signal } = rx.abortable();
    el.addEventListener('loadedmetadata', update, { signal });
    el.addEventListener('durationchange', update, { signal });
    el.addEventListener('timeupdate', update, { signal });

    update();
    return dispose;
  }, [videoRef, src, crop, lens, onTimeUpdate, onDurationChange]);

  /**
   * API:
   */
  return {
    lens,
    currentTime: lens.toCropped(currentTimeFull),
    duration: lens.duration.cropped,
    full: { currentTime: currentTimeFull, duration: durationFull },
  } as const;
}
