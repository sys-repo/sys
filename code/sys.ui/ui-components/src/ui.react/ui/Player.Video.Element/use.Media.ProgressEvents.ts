import { useEffect } from 'react';
import { type t, Rx } from './common.ts';
import { Crop } from './m.Crop.ts';

type MediaProgressEventsArgs = {
  readonly videoRef: React.RefObject<HTMLVideoElement | null>;
  readonly src: t.VideoElementProps['src'];
  readonly slice: t.VideoElementProps['slice'];
  readonly onTimeUpdateRef: React.RefObject<t.VideoElementProps['onTimeUpdate'] | undefined>;
  readonly onDurationChangeRef: React.RefObject<
    t.VideoElementProps['onDurationChange'] | undefined
  >;
  readonly setCurrentTimeFull: React.Dispatch<React.SetStateAction<number>>;
  readonly setDurationFull: React.Dispatch<React.SetStateAction<number>>;
};

export function useMediaProgressEvents(args: MediaProgressEventsArgs) {
  const {
    videoRef,
    src,
    slice,
    onTimeUpdateRef,
    onDurationChangeRef,
    setCurrentTimeFull,
    setDurationFull,
  } = args;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const update = () => {
      const fullDuration = Number.isFinite(el.duration) ? el.duration : 0;
      const lens = Crop.lens(slice, fullDuration);

      setDurationFull(fullDuration);
      onDurationChangeRef.current?.({ secs: lens.duration.cropped });

      const rawTime = Number.isFinite(el.currentTime) ? el.currentTime : 0;
      const hasDuration = fullDuration > 0;
      const secsFull = hasDuration
        ? Math.max(0, Math.min(rawTime, fullDuration))
        : Math.max(0, rawTime);
      const secsCropped = hasDuration ? lens.toCropped(secsFull) : Math.max(0, rawTime);

      setCurrentTimeFull(secsFull);
      onTimeUpdateRef.current?.({ secs: secsCropped });
    };

    const { dispose, signal } = Rx.abortable();
    el.addEventListener('loadedmetadata', update, { signal });
    el.addEventListener('durationchange', update, { signal });
    el.addEventListener('timeupdate', update, { signal });

    update();
    return dispose;
  }, [src, slice]);
}
