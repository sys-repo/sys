import React from 'react';

import type { t } from './common.ts';
import { useEagerFactory } from './use.Factory.Eager.tsx';
import { validatePlan } from './u.validatePlan.ts';

/**
 * Unified factory hook:
 * - 'eager' (default): resolve immediately and return { element, loading, error }.
 * - 'suspense': wraps the resolved element with <Suspense fallback={...}> while still
 *   returning the eager shape for observability.
 * - Optional `validate` pass over the plan (boolean shorthand or options object).
 */
export function useFactory<F extends t.ReactFactory<any, any>>(
  factory: F | undefined,
  plan: t.Plan<F> | undefined,
  opts: t.UseFactoryOptions = {},
): t.UseFactoryResult {
  const { key, strategy = 'eager' } = opts;

  // Resolve once eagerly to keep hooks stable.
  const eager = useEagerFactory<F>(factory, plan, { key });
  const { element, loading, error } = eager;

  // Optional: validation pass (no side-effects on render tree).
  const validate = normalizeValidate(opts.validate);
  if (factory && plan && validate && validate.mode === 'always') {
    // If you have prebuilt validators, pass via `validate.validators`.
    // Otherwise, skip derivation here to keep this hook pure & lightweight.
    if (validate.validators) {
      validatePlan(plan as any, validate.validators, validate);
    }
  }

  if (strategy === 'suspense') {
    const fallback = 'fallback' in (opts as any) ? (opts as any).fallback : null;
    return {
      element: <React.Suspense fallback={fallback}>{element}</React.Suspense>,
      loading,
      error,
    };
  }

  // Eager passthrough.
  return { element, loading, error };
}

/**
 * Normalize `validate` shorthand:
 *   - true  -> { mode: 'always' }
 *   - false -> { mode: 'never' }
 *   - object/undefined passthrough
 */
function normalizeValidate(v?: t.UseFactoryValidate): t.UseFactoryValidateOptions | undefined {
  if (typeof v === 'string') return { mode: v };
  if (v === true) return { mode: 'always' };
  if (v === false) return { mode: 'never' };
  return v;
}
