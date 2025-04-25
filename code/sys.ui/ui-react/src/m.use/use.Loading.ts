import { useEffect, useRef, useState } from 'react';
import { type t } from './common.ts';

/**
 * Hook Factory: Keep track of several parts of a component that are loading.
 */
export const useLoading: t.UseLoading = <P extends string>(parts: P[]) => {
  const loadedRef = useRef(new Set<P>());
  const loaded = loadedRef.current;

  const [, setCount] = useState(0);
  const [complete, setComplete] = useState(false);
  const percent = wrangle.percent(parts, loaded);

  /**
   * Effect: redraw when ready.
   */
  useEffect(() => {
    if (percent === 1) setComplete(true);
  }, [percent]);

  /**
   * API:
   */
  return {
    percent,
    get is() {
      return { complete, loading: !complete };
    },

    get parts() {
      return parts.map((name) => ({ name, loaded: loaded.has(name) }));
    },

    ready(part?: P) {
      if (part !== undefined) {
        loaded.add(part);
        setCount((n) => n + 1);
      }
      return wrangle.percent(parts, loaded) === 1;
    },
  };
};

/**
 * Helpers:
 */
const wrangle = {
  percent<P extends string>(parts: P[], loaded: Set<P>): t.Percent {
    return Math.min(1, Math.max(0, loaded.size / parts.length));
  },
} as const;
