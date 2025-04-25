import { useEffect, useRef, useState } from 'react';
import { type t } from './common.ts';

/**
 * Hook Factory: Keep track of several parts of a component that are loading.
 */
export const useLoading: t.UseLoading = <P extends string>(parts: P[]) => {
  const loadedRef = useRef(new Set<P>());
  const loaded = loadedRef.current;
  let _parts: t.LoadingHookPart<P>[] | undefined;

  const [, setCount] = useState(0);
  const [ready, seteReady] = useState(false);
  const percent: t.Percent = Math.min(1, Math.max(0, loaded.size / parts.length));

  /**
   * Effect: redraw when ready.
   */
  useEffect(() => {
    if (percent === 1) seteReady(true);
  }, [percent]);

  /**
   * API:
   */
  return {
    percent,
    get is() {
      return { ready, loading: !ready };
    },

    get parts() {
      return _parts ?? (_parts = parts.map((part) => ({ part, loaded: loaded.has(part) })));
    },

    loaded(part: P) {
      loaded.add(part);
      setCount((n) => n + 1);
    },
  };
};
