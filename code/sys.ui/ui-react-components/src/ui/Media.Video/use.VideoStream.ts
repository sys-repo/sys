import { useEffect, useMemo, useState } from 'react';
import { type t, AspectRatio, D, Err, Is, Obj, rx } from './common.ts';
import { getStream } from './u.getStream.ts';

export const useVideoStream: t.UseVideoStream = (streamOrConstraints, options = {}) => {
  const { filter } = options;

  /**
   * Memoised inputs.
   */
  const deps = [Is.mediaStream(streamOrConstraints) ? 0 : Obj.hash(streamOrConstraints)];
  const input = {
    constraints: useMemo<MediaStreamConstraints | undefined>(() => {
      if (Is.mediaStream(streamOrConstraints)) return undefined;
      return streamOrConstraints ?? D.constraints;
    }, deps),
    stream: useMemo<MediaStream | undefined>(() => {
      return Is.mediaStream(streamOrConstraints) ? streamOrConstraints : undefined;
    }, deps),
  } as const;

  const zoom = useMemo<Partial<t.MediaZoomValues> | undefined>(
    () => options.zoom,
    [Obj.hash(options.zoom)],
  );

  /**
   * Hooks:
   */
  const [filtered, setFiltered] = useState<MediaStream>();
  const [raw, setRaw] = useState<MediaStream>();
  const [error, setError] = useState<t.StdError>();
  const [aspectRatio, setAspectRatio] = useState<string>('');

  /**
   * Effect: acquire / transform stream.
   */
  useEffect(() => {
    const life = rx.lifecycle();

    (async () => {
      try {
        const res = await getStream(input.stream ?? input.constraints, { filter, zoom });
        if (life.disposed) return;

        setRaw(res.raw);
        setFiltered(res.filtered);
        setAspectRatio(AspectRatio.toString(res.filtered));
      } catch (err) {
        console.error(err);
        if (!life.disposed) setError(Err.std(err));
      }
    })();

    return () => {
      filtered?.getTracks().forEach((t) => t.stop());
      return life.dispose();
    };
  }, [input.constraints, input.stream, filter, zoom]);

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
