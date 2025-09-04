import { Http } from '@sys/http/client';
import { useEffect, useRef, useState } from 'react';
import { type t, Err } from './common.ts';

/**
 * Hook: Load the `dist.json` file from the server (if avilable).
 */
export const useDist: t.UseDistFactory = (options = {}) => {
  const { sampleFallback = false } = options;
  const is: t.DistHook['is'] = { sample: sampleFallback };

  const [count, setRender] = useState(0);
  const redraw = () => setRender((n) => n + 1);

  const jsonRef = useRef<t.DistPkg>(undefined);
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
  const api: t.DistHook = {
    count,
    is,
    error,
    get json() {
      return jsonRef.current;
    },
    toString() {
      const json = api.json;
      if (!json) return '(not found)';
      const { name, version } = json.pkg;
      const hx = json.hash.digest.slice(-5);
      return `${name}@${version}-${hx}`;
    },
  };
  return api;
};
