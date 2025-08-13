import React, { useEffect, useState } from 'react';
import { type t, rx } from './common.ts';

export function useReadyState(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  props: Pick<t.VideoElementProps, 'src'>,
) {
  const [readyState, setReadyState] = useState<t.NumberMediaReadyState>(0);

  /**
   * Effect: event listeners
   */
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    setReadyState(0);

    const { dispose, signal } = rx.abortable();
    const update = () => setReadyState(el.readyState as t.NumberMediaReadyState);

    // ≥ 1: HAVE_METADATA
    el.addEventListener('loadedmetadata', update, { signal });

    // ≥ 2: HAVE_CURRENT_DATA
    el.addEventListener('loadeddata', update, { signal });

    // ≥ 3: HAVE_FUTURE_DATA
    el.addEventListener('canplay', update, { signal });

    // ≥ 4: HAVE_ENOUGH_DATA
    el.addEventListener('canplaythrough', update, { signal });

    return dispose;
  }, [videoRef.current, props.src]);

  /**
   * API:
   */
  return readyState;
}
