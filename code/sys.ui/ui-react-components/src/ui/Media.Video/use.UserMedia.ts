import { useEffect, useState } from 'react';
import { Obj, type t } from './common.ts';

/**
 * Acquire/cleanup device media.
 */
export const useUserMedia: t.UseUserMedia = (constraints: MediaStreamConstraints) => {
  const [stream, setStream] = useState<MediaStream>();
  const [error, setError] = useState<DOMException>();

  /**
   * Effect: retrieve the user-media based on given constraints.
   */
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

  /**
   * Public API:
   */
  return { stream, error };
};
