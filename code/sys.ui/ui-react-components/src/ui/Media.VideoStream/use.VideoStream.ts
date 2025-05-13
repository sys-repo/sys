import { useEffect, useMemo, useState } from 'react';
import { type t, D, Err, Obj } from './common.ts';
import { Filter } from './m.Filter.ts';

export const useVideoStream: t.UseVideoStream = (
  c: MediaStreamConstraints = D.constraints,
  filter,
) => {
  const constraints = useMemo<MediaStreamConstraints>(() => c, [Obj.hash(c)]);
  const [stream, setStream] = useState<MediaStream>();
  const [error, setError] = useState<t.StdError>();
  const [aspectRatio, setAspectRatio] = useState<string>('');

  /**
   * Effect: retrieve stream.
   */
  useEffect(() => {
    let cancelled = false;

    Filter.getStream(constraints, filter)
      .then((stream) => {
        if (cancelled) return;
        setStream(stream);
        setAspectRatio(wrangle.ratio(stream));
      })
      .catch((err: unknown) => {
        console.error(err);
        if (!cancelled) setError(Err.std(err));
      });

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [constraints, filter]);

  /**
   * API:
   */
  return {
    stream,
    aspectRatio,
    error,
  };
};

/**
 * Helpers:
 */
const wrangle = {
  ratio(stream: MediaStream) {
    const [video] = stream.getVideoTracks();
    const { width, height, aspectRatio } = video.getSettings();
    const ratio = aspectRatio ?? width! / height!;
    return `${Math.round(ratio * 1000) / 1000} / 1`; // "1.778 / 1"
  },
} as const;
