import { useEffect, useRef } from 'react';
import { type t, rx, READY_STATE } from './common.ts';

export function useCropBounds(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  lens: t.VideoCropLens,
  props: Pick<t.VideoElementProps, 'loop'>,
) {
  const { loop = false } = props;

  /**
   * Refs:
   */
  const lastKeyRef = useRef<string>(undefined);
  const endedRef = useRef(false);
  const EPS = 0.01; // ← Float slop.

  /**
   * Effect:
   */
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const key = `${lens.duration.full}:${lens.range.start}:${lens.range.end}:${loop}`;
    if (lastKeyRef.current === key) return;

    lastKeyRef.current = key;
    endedRef.current = false; // NB: reset on new lens.

    const { dispose, signal } = rx.abortable();
    const start = lens.range.start ?? 0;
    const end = lens.range.end ?? lens.duration.full;

    let ticking = false;
    const clamp = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        ticking = false;

        if (!loop && endedRef.current) {
          if (!el.paused && el.currentTime >= end - EPS) {
            el.currentTime = start;
            endedRef.current = false;
          }
          return;
        }

        if (el.currentTime < start - EPS) el.currentTime = start;
        if (el.currentTime >= end - EPS) {
          if (Math.abs(el.currentTime - end) > EPS) el.currentTime = end;

          if (loop) {
            el.currentTime = start;
            if (el.paused) void el.play().catch(() => {});
            endedRef.current = false;
            return;
          }
          if (!loop && endedRef.current) return; // Safety guard.

          if (!el.paused) el.pause();
          if (!endedRef.current) {
            endedRef.current = true;
            el.dispatchEvent(new Event('ended'));
          }
          return;
        }
      });
    };

    if (el.readyState >= READY_STATE.HAVE_METADATA) {
      clamp();
    } else {
      el.addEventListener('loadedmetadata', () => clamp(), { once: true, signal });
    }

    el.addEventListener('play', clamp, { signal });
    el.addEventListener('seeking', clamp, { signal });
    el.addEventListener('timeupdate', clamp, { signal });

    return dispose;
  }, [videoRef, lens, loop]);
}
