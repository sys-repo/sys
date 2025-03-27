import { Http } from '@sys/http';
import { useEffect, useState } from 'react';
import { type t, Err } from './common.ts';

type Options = {
  useSample?: boolean;
  onChanged?: (e: { dist?: t.DistPkg }) => void;
};

/**
 * Hook: load the ./dist.json package file (if available).
 */
export function useDist(options: Options = {}) {
  const is = { sample: options.useSample ?? false };

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
      redraw();
      setJson(undefined);
      options.onChanged?.({ dist });
    };

    setJson(undefined);
    if (is.sample) {
      import('./use.Dist.sample.ts').then((e) => {
        if (fetch.disposed) return;
        changeDist(e.sample);
      });
    } else {
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
  }, [is.sample]);

  /**
   * API
   */
  return {
    redraw: count,
    is,
    json,
    error,
  } as const;
}
