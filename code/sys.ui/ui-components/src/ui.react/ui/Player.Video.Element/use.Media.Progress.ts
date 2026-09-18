import { useEffect, useMemo, useState } from 'react';
import { type t } from './common.ts';
import { Crop } from './m.Crop.ts';
import { useLatestRef } from './use.LatestRef.ts';
import { useMediaProgressEvents } from './use.Media.ProgressEvents.ts';

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
  const onTimeUpdateRef = useLatestRef(onTimeUpdate);
  const onDurationChangeRef = useLatestRef(onDurationChange);

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
  useMediaProgressEvents({
    videoRef,
    src,
    slice,
    onTimeUpdateRef,
    onDurationChangeRef,
    setCurrentTimeFull,
    setDurationFull,
  });

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
