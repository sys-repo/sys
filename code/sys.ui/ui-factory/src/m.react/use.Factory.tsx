import React from 'react';
import { type t } from './common.ts';
import { useEagerFactory } from './use.Factory.Eager.tsx';

/**
 * Unified factory hook:
 * - 'eager' (default): resolve immediately and return { element, loading, error }.
 * - 'suspense': wraps the resolved element with <Suspense fallback={...}>.
 *   (useful only if children actually suspend via React.lazy or data fetching)
 */
export const useFactory: t.UseFactory = (factory, plan, opts = {}) => {
  const { key, strategy = 'eager' } = opts;

  // Always resolve eagerly once; keep hooks stable.
  const { element, loading, error } = useEagerFactory(factory as any, plan as any, { key });

  if (strategy === 'suspense') {
    const fallback = 'fallback' in opts ? (opts as any).fallback : null;
    return {
      element: <React.Suspense fallback={fallback}>{element}</React.Suspense>,
      loading: false,
      error: null,
    };
  }

  // Eager passthrough:
  return { element, loading, error };
};
