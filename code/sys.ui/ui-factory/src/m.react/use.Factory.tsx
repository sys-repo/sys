import React from 'react';

import type { t } from './common.ts';
import { useEagerFactory } from './use.Factory.Eager.tsx';

/**
 * Unified factory hook:
 * - 'eager' (default): resolve immediately and return { element, loading, error }.
 * - 'suspense': wraps the resolved element with <Suspense fallback={...}>.
 *   (useful only if children actually suspend via React.lazy or data fetching)
 */
export function useFactory<F extends t.ReactFactory<any, any>>(
  factory: F | undefined,
  plan: t.Plan<F> | undefined,
  opts: t.UseFactoryOptions = {},
): t.UseFactoryResult {
  const { key, strategy = 'eager' } = opts;

  // Resolve once eagerly to keep hook ordering stable.
  const { element, loading, error } = useEagerFactory<F>(factory, plan, { key });

  if (strategy === 'suspense') {
    const options = opts as Extract<typeof opts, { fallback?: React.ReactNode }>;
    const fallback = 'fallback' in options ? options.fallback : null;
    return {
      element: <React.Suspense fallback={fallback}>{element}</React.Suspense>,
      loading: false,
      error: null,
    };
  }

  // Eager passthrough:
  return { element, loading, error };
}
