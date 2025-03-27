import { Http } from '@sys/http';
import { useEffect, useState } from 'react';
import { type t } from './common.ts';

/**
 * Hook: load the ./dist.json package file (if available).
 */
export function useDist(options: { log?: boolean } = {}) {
  const [json, setJson] = useState<t.DistPkg>();

  /**
   * Effect: Fetch JSON.
   */
  useEffect(() => {
    const fetch = Http.fetch();
    fetch.json<t.DistPkg>('./dist.json').then((e) => {
      if (e.ok) setJson(e.data);
    });
    return fetch.dispose;
  }, []);

  /**
   * API
   */
  return { json } as const;
}
