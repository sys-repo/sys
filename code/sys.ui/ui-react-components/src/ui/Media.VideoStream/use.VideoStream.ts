import { useEffect, useMemo, useState } from 'react';
import { type t, D, Err, Obj } from './common.ts';
import { getStream } from './u.getStream.ts';
import { AspectRatio } from './m.AspectRatio.ts';

export const useVideoStream: t.UseVideoStream = (args) => {
  const { filter } = args;
  const constraints = useMemo<MediaStreamConstraints>(
    () => args.constraints ?? D.constraints,
    [Obj.hash(args.constraints)],
  );

  const [stream, setStream] = useState<MediaStream>();
  const [error, setError] = useState<t.StdError>();
  const [aspectRatio, setAspectRatio] = useState<string>('');

  /**
   * Effect: retrieve stream.
   */
  useEffect(() => {
    let cancelled = false;

    getStream({ constraints, filter })
      .then((stream) => {
        if (cancelled) return;
        setStream(stream);
        setAspectRatio(AspectRatio.toString(stream));
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
