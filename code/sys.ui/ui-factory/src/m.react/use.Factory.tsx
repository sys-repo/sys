import React from 'react';

import { type t } from './common.ts';
import { useEagerFactory } from './use.Factory.Eager.tsx';

/**
 * Unified factory hook:
 * - 'suspense' (default): wraps the resolved element in <Suspense>.
 * - 'eager': resolves immediately and returns { element, loading, error }.
 */
export const useFactory: t.UseFactory = (factory, plan, opts = {}) => {
  const { key, strategy = 'suspense' } = opts;

  // 1. Always resolve eagerly once (stable hooks, single resolver):
  const { element, loading, error } = useEagerFactory(factory as any, plan as any, { key });

  // 2. Build a Lazy component from the latest resolved element:
  const Lazy = React.useMemo(() => {
    const Inner: React.FC = () => element ?? null;
    return React.lazy(async () => ({ default: Inner }));
  }, [element, key]);

  // 3. Strategy branch only affects the *returned value*, not hook calls:
  if (strategy === 'suspense') {
    const wrapped = (
      <React.Suspense fallback={'fallback' in (opts ?? {}) ? (opts as any).fallback : null}>
        <Lazy />
      </React.Suspense>
    );
    return { element: wrapped, loading: false, error: null };
  }

  // Eager result passthrough:
  return { element, loading, error };
};
