import { Http } from '@sys/http';
import { useEffect, useState } from 'react';
import { type t, Err } from './common.ts';

/**
 * Hook: load the ./dist.json package file (if available).
 */
export const useDist: t.UseDistFactory = (options = {}) => {
  const is: t.UseDist['is'] = { useSample: options.useSample ?? false };

  const [count, setRender] = useState(0);
  const redraw = () => setRender((n) => n + 1);

  const [json, setJson] = useState<t.DistPkg>();
  const [error, setError] = useState<t.StdError>();

  /**
   * Effect: Fetch JSON.
   */
  useEffect(() => {
    const fetch = Http.fetch();

    const changeDist = (dist?: t.DistPkg) => {
      setJson(dist);
      redraw();
    };

    if (is.useSample) {
      setJson(undefined);
      import('./use.Dist.sample.ts').then((e) => {
        changeDist(e.sample);
        if (fetch.disposed) return;
      });
    } else {
      setJson(undefined);
      fetch
        .json<t.DistPkg>('./dist.json')
        .then((e) => {
          if (fetch.disposed) return;
          if (!e.error) changeDist(e.data);
          else setError(Err.std(e.error));
        })
        .catch((err: any) => setError(Err.std(err)));
    }
    return fetch.dispose;
  }, [is.useSample]);

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
