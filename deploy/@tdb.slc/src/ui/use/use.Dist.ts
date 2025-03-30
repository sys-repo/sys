import { Http } from '@sys/http';
import { useEffect, useState } from 'react';
import { type t, Err } from './common.ts';

/**
 * Hook: Load the `dist.json` file from the server (if avilable).
 */
export const useDist: t.UseDistFactory = (options = {}) => {
  const { useSampleFallback = false } = options;
  const is: t.UseDist['is'] = { sample: useSampleFallback };

  const [count, setRender] = useState(0);
  const redraw = () => setRender((n) => n + 1);

  const [json, setJson] = useState<t.DistPkg>();
  const [error, setError] = useState<t.StdError>();

  /**
   * Effect: Fetch JSON (or optionally load sample data).
   */
  useEffect(() => {
    const fetch = Http.fetch();

    const update = (dist?: t.DistPkg) => {
      setJson(dist);
      redraw();
    };

    const loadJson = async () => {
      setJson(undefined);
      const e = await fetch.json<t.DistPkg>('./dist.json');
      if (fetch.disposed) return;
      if (e.ok) update(e.data);
      else setError(Err.std(e.error));
    };

    const loadSample = async () => {
      setJson(undefined);
      const m = await import('./use.Dist.sample.ts');
      update(m?.sample);
    };

    const finish = () => {
      if (!json && useSampleFallback) loadSample();
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
    json,
    error,
  };
  return api;
};
