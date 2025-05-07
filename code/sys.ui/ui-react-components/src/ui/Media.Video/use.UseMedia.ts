import { useEffect, useState } from 'react';
import { Obj } from './common.ts';

/**
 * Acquire/cleanup device media.
 */
export function useUserMedia(constraints: MediaStreamConstraints) {
  const [stream, setStream] = useState<MediaStream>();
  const [error, setError] = useState<DOMException>();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const media = await navigator.mediaDevices.getUserMedia(constraints);
        if (!cancelled) setStream(media);
      } catch (err) {
        if (!cancelled) setError(err as DOMException);
      }
    })();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [Obj.hash(constraints)]);

  return { stream, error };
}
