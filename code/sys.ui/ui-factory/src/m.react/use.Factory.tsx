import React from 'react';

import { type t } from './common.ts';
import { useEagerFactory } from './use.Factory.Eager.tsx';
import { useLazyFactory } from './use.Factory.Lazy.tsx';

/**
 * Unified factory hook:
 * - 'eager' (default): resolve immediately and return { ok, element, loading, issues }.
 * - 'suspense': uses the lazy path and wraps output in <Suspense fallback={...}>,
 *   while still returning the same observable shape (ok, loading, issues).
 * - Always calls both hooks to preserve Hooks order; only the active one is live.
 */
export function useFactory<F extends t.ReactFactory<any, any>>(
  factory: F | undefined,
  plan: t.Plan<F> | undefined,
  opts: t.UseFactoryOptions = {},
): t.UseFactoryResult {
  const { key, strategy = 'eager', validate, debug } = opts;

  const common = { key, validate, debug };
  const eager = useEagerFactory<F>(factory, plan, {
    ...common,
    disabled: strategy !== 'eager',
  });

  const lazy = useLazyFactory<F>(factory, plan, {
    ...common,
    disabled: strategy !== 'suspense',
  });

  if (strategy === 'suspense') {
    const fallback = 'fallback' in opts ? opts.fallback : null;

    // Render the lazy component under Suspense, but surface the same observable fields.
    const element = (
      <React.Suspense fallback={fallback}>
        <lazy.Lazy />
      </React.Suspense>
    );
    return { ...lazy, element };
  }

  // Eager strategy
  return eager;
}
