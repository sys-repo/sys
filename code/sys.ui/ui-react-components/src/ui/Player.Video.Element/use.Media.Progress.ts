import { useEffect, useMemo, useRef, useState } from 'react';
import { type t, Rx } from './common.ts';
import { Crop } from './m.Crop.ts';

export function useMediaProgress(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  props: Pick<t.VideoElementProps, 'src' | 'slice' | 'onTimeUpdate' | 'onDurationChange'>,
) {
  const { src, slice, onTimeUpdate, onDurationChange } = props;

  /**
   * State:
   */
  const [currentTimeFull, setCurrentTimeFull] = useState(0);
  const [durationFull, setDurationFull] = useState(0);

  /**
   * Callback refs:
   * Avoid effect re-runs caused by changing function identities.
   */
  const onTimeUpdateRef = useRef<typeof onTimeUpdate>(onTimeUpdate);
  const onDurationChangeRef = useRef<typeof onDurationChange>(onDurationChange);

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  useEffect(() => {
    onDurationChangeRef.current = onDurationChange;
  }, [onDurationChange]);

  /**
   * Lens (UI-facing; stable projection).
   */
  const lens = useMemo<t.VideoCropLens>(() => {
    return Crop.lens(slice, durationFull);
  }, [slice, durationFull]);

  /**
   * Effect: reset on source or slice change.
   */
  useEffect(() => {
    setCurrentTimeFull(0);
    setDurationFull(0);
    onTimeUpdateRef.current?.({ secs: 0 });
    onDurationChangeRef.current?.({ secs: 0 });
  }, [src, slice]);

  /**
   * Effect: media listeners.
   * NOTE: Lens is rebuilt per-tick; not a dependency.
   */
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const update = () => {
      const fullDuration = Number.isFinite(el.duration) ? el.duration : 0;
      const lens = Crop.lens(slice, fullDuration);

      setDurationFull(fullDuration);
      onDurationChangeRef.current?.({ secs: lens.duration.cropped });

      const secsFull = Math.max(0, Math.min(el.currentTime, fullDuration));
      const secsCropped = lens.toCropped(secsFull);

      setCurrentTimeFull(secsFull);
      onTimeUpdateRef.current?.({ secs: secsCropped });
    };

    const { dispose, signal } = Rx.abortable();
    el.addEventListener('loadedmetadata', update, { signal });
    el.addEventListener('durationchange', update, { signal });
    el.addEventListener('timeupdate', update, { signal });

    update();
    return dispose;
  }, [videoRef, src, slice]);

  /**
   * API:
   */
  return {
    lens,
    currentTime: lens.toCropped(currentTimeFull),
    duration: lens.duration.cropped,
    full: {
      currentTime: currentTimeFull,
      duration: durationFull,
    },
  } as const;
}
