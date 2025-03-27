import { Http } from '@sys/http';
import { useEffect, useState } from 'react';
import { type t, Err } from './common.ts';

/**
 * Hook: load the ./dist.json package file (if available).
 */
export function useDist(options: { sample?: boolean } = {}) {
  const is = { sample: options.sample ?? false };

  const [json, setJson] = useState<t.DistPkg>();
  const [error, setError] = useState<t.StdError>();

  /**
   * Effect: Fetch JSON.
   */
  useEffect(() => {
    const fetch = Http.fetch();
    if (is.sample) {
      import('./use.Dist.sample.ts').then((e) => {
        if (fetch.disposed) return;
        setJson(e.sample);
      });
    } else {
      fetch
        .json<t.DistPkg>('./dist.json')
        .then((e) => {
          if (fetch.disposed) return;
          if (!e.error) setJson(e.data);
          else setError(Err.std(e.error));
        })
        .catch((err: any) => setError(Err.std(err)));
    }
    return fetch.dispose;
  }, [is.sample]);

  /**
   * API
   */
  const hash = json?.hash.digest;
  const pkg = json?.pkg;
  return { is, pkg, hash, json, error } as const;
}
