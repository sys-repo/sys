import { Http } from '@sys/http';
import { useEffect, useRef, useState } from 'react';
import { type t, Err } from './common.ts';

/**
 * Hook: Load the `dist.json` file from the server (if avilable).
 */
export const useDist: t.UseDistFactory = (options = {}) => {
  const { useSampleFallback = false } = options;
  const is: t.UseDist['is'] = { sample: useSampleFallback };

  const [count, setRender] = useState(0);
  const redraw = () => setRender((n) => n + 1);

  const jsonRef = useRef<t.DistPkg>();
  const [error, setError] = useState<t.StdError>();

  /**
   * Effect: Fetch JSON (or optionally load sample data).
   */
  useEffect(() => {
    const fetch = Http.fetch();

    const update = (dist?: t.DistPkg) => {
      jsonRef.current = dist;
      redraw();
    };

    const loadJson = async () => {
      jsonRef.current = undefined;
      const res = await fetch.json<t.DistPkg>('./dist.json');
      if (fetch.disposed) return;
      if (res.ok) update(res.data);
      else {
        setError(Err.std(res.error));
      }
    };

    const loadSample = async () => {
      jsonRef.current = undefined;
      const m = await import('./use.Dist.sample.ts');
      update(m?.sample);
    };

    const finish = async () => {
      if (!jsonRef.current && is.sample) loadSample();
    };

    loadJson().then(finish).catch(finish);
    return fetch.dispose;
  }, [is.sample]);

  /**
   * API
   */
  const api: t.UseDist = {
    count,
    is,
    error,
    get json() {
      return jsonRef.current;
    },
  };
  return api;
};
