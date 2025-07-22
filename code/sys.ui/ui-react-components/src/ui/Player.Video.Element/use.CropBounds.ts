import { useEffect, useRef } from 'react';

import { type t, rx } from './common.ts';
import { Crop } from './u.ts';

type P = Pick<t.VideoElementProps, 'crop' | 'src' | 'onEnded'>;

/**
 * Enforce [start..end] playback bounds on the <video>.
 */
export function useCropBounds(videoRef: React.RefObject<HTMLVideoElement>, props: P) {
  const { src, onEnded } = props;
  const crop = Crop.wrangle(props.crop);
  const lastKeyRef = useRef<string>();

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    // Build a key so we only reset once per (src, start, end):
    const key = `${src}::${crop?.start ?? 0}..${crop?.end ?? 0}`;
    if (lastKeyRef.current !== key) {
      lastKeyRef.current = key;
      if (!crop) {
        el.currentTime = 0;
        return;
      }
      el.currentTime = crop.start ?? 0;
    }

    if (crop) {
      const { dispose, signal } = rx.abortable();
      const start = crop.start ?? 0;
      const end = Crop.resolveEnd(crop.end, el.duration);

      const clampToStart = () => {
        if (el.currentTime < start) el.currentTime = start;
      };
      const clampAndEnd = () => {
        if (el.currentTime < start) el.currentTime = start;
        if (el.currentTime > end) {
          el.currentTime = end;
          el.pause();
          onEnded?.({ reason: 'ended' });
        }
      };

      el.addEventListener('loadedmetadata', clampToStart, { signal });
      el.addEventListener('play', clampToStart, { signal });
      el.addEventListener('timeupdate', clampAndEnd, { signal });
      return dispose;
    }
  }, [videoRef, src, crop?.start, crop?.end, onEnded]);
}
