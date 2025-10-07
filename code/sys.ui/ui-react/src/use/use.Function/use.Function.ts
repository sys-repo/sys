import React from 'react';
import { type t } from '../common.ts';

/**
 * Hook: useFunction
 *
 * Returns a stable callback that always calls the latest function.
 * Intended for passing functions into hooks/effects without resubscription churn.
 */
export const useFunction: t.UseFunction = ((fn) => {
  const ref = React.useRef(fn);
  React.useEffect(() => {
    ref.current = fn;
  }, [fn]);

  return React.useCallback((...args: unknown[]) => {
    return ref.current?.(...args); // no-op if undefined
  }, []) as any;
}) as t.UseFunction;
