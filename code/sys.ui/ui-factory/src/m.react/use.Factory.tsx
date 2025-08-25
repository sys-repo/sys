import React from 'react';

import { type t } from './common.ts';
import { useEagerFactory } from './use.Factory.Eager.tsx';

/**
 * Unified factory hook:
 * - 'eager' (default): resolve immediately and return { ok, element, loading, issues }.
 * - 'suspense': wraps the resolved element with <Suspense fallback={...}> while still
 *   returning the eager shape for observability.
 * - Optional `validate` pass over the plan (boolean/enum/object).
 */
export function useFactory<F extends t.ReactFactory<any, any>>(
  factory: F | undefined,
  plan: t.Plan<F> | undefined,
  opts: t.UseFactoryOptions = {},
): t.UseFactoryResult {
  const { key, strategy = 'eager', validate } = opts;

  const eager = useEagerFactory<F>(factory, plan, { key, validate });

  if (strategy === 'suspense') {
    const fallback = 'fallback' in (opts as any) ? (opts as any).fallback : null;
    const element = <React.Suspense fallback={fallback}>{eager.element}</React.Suspense>;
    return { ...eager, element };
  }

  return eager;
}
