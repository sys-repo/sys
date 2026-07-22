import React, { useEffect } from 'react';
import { type t, Rx } from './common.ts';

/**
 * Effect: track buffered status:
 */
export function useBuffered(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  props: Pick<t.VideoElementProps, 'onBufferedChange'>,
) {
  const { onBufferedChange } = props;

  /**
   * Effect: track buffered status:
   */
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const calcBuffered = () => {
      if (!Number.isFinite(el.duration) || el.duration === 0) return;
      const ranges = el.buffered;
      const end = ranges.length ? ranges.end(ranges.length - 1) : 0;
      const buffered = Math.min(1, Math.max(0, end / el.duration));
      onBufferedChange?.({ buffered, reason: 'video-element-event' });
    };

    const { signal, dispose } = Rx.abortable();
    el.addEventListener('progress', calcBuffered, { signal });
    el.addEventListener('loadedmetadata', calcBuffered, { signal }); // First value.

    return dispose;
  }, [videoRef.current]);
}
