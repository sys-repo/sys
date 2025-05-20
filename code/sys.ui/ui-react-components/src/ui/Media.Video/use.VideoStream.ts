import { useEffect, useMemo, useState } from 'react';
import { type t, D, Err, Obj } from './common.ts';
import { AspectRatio } from './m.AspectRatio.ts';
import { getStream } from './u.getStream.ts';

export const useVideoStream: t.UseVideoStream = (args) => {
  const { filter } = args;
  const zoom = useMemo<t.MediaZoomValues | undefined>(() => args.zoom, [Obj.hash(args.zoom)]);
  const constraints = useMemo<MediaStreamConstraints>(
    () => args.constraints ?? D.constraints,
    [Obj.hash(args.constraints)],
  );

  const [filtered, setFiltered] = useState<MediaStream>();
  const [raw, setRaw] = useState<MediaStream>();
  const [error, setError] = useState<t.StdError>();
  const [aspectRatio, setAspectRatio] = useState<string>('');

  /**
   * Effect: retrieve stream.
   */
  useEffect(() => {
    let cancelled = false;

    getStream(constraints, { filter, zoom })
      .then(async (e) => {
        if (cancelled) return;
        setFiltered(e.filtered);
        setRaw(e.raw);
        setAspectRatio(AspectRatio.toString(e.filtered));
      })
      .catch((err: unknown) => {
        console.error(err);
        if (!cancelled) setError(Err.std(err));
      });

    return () => {
      cancelled = true;
      filtered?.getTracks().forEach((t) => t.stop());
    };
  }, [constraints, filter]);

  /**
   * API:
   */
  const api: t.VideoStreamHook = {
    stream: { raw, filtered },
    aspectRatio,
    error,
  };
  return api;
};
