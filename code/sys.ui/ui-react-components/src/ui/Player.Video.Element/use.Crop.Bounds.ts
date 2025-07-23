import { useEffect } from 'react';
import { type t, Obj, rx } from './common.ts';
import { Crop } from './m.Crop.ts';

export function useCropBounds(
  videoRef: React.RefObject<HTMLVideoElement>,
  props: Pick<t.VideoElementProps, 'crop' | 'src' | 'onEnded'>,
) {
  const { src, onEnded } = props;
  const range = Crop.toRange(props.crop);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const clamp = () => {
      const rawDur = Number.isFinite(el.duration) ? el.duration : 0;
      const start = range?.start ?? 0;
      const end = Crop.resolveEnd(range?.end, rawDur);

      if (el.currentTime < start) el.currentTime = start;
      if (el.currentTime > end) {
        el.currentTime = end;
        el.pause();
        onEnded?.({ reason: 'ended' });
      }
    };

    // Seed and listen:
    const { dispose, signal } = rx.abortable();


    return dispose;
  }, [videoRef, src, Obj.hash(range), onEnded]);
}
