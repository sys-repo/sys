import { useEffect } from 'react';

import { type t, Obj } from './common.ts';
import { Crop } from './u.ts';

export function useCropBounds(
  videoRef: React.RefObject<HTMLVideoElement>,
  props: Pick<t.VideoElementProps, 'crop' | 'src' | 'onEnded'>,
) {
  const { src, onEnded } = props;
  const crop = Crop.wrangle(props.crop);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const clamp = () => {
      const rawDur = Number.isFinite(el.duration) ? el.duration : 0;
      const start = crop?.start ?? 0;
      const end = Crop.resolveEnd(crop?.end, rawDur);

      if (el.currentTime < start) el.currentTime = start;
      if (el.currentTime > end) {
        el.currentTime = end;
        el.pause();
        onEnded?.({ reason: 'ended' });
      }
    };

    // seed & listen
    clamp();
    el.addEventListener('loadedmetadata', clamp);
    el.addEventListener('timeupdate', clamp);

    return () => {
      el.removeEventListener('loadedmetadata', clamp);
      el.removeEventListener('timeupdate', clamp);
    };
  }, [videoRef, src, Obj.hash(crop), onEnded]);
}
