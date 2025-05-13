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

  /**
   * Effect: retrieve stream.
   */
  useEffect(() => {
    let cancelled = false;

    Filter.getStream(constraints, filter)
      .then((s) => !cancelled && setStream(s))
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
  return { stream, error };
};
