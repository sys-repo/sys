import React from 'react';

import { type t, Schema } from './common.ts';
import { validatePlan } from './u.validatePlan.ts';
import { useEagerFactory } from './use.Factory.Eager.tsx';

type AnyFactory = t.Factory<any, any>;

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
  const validate = wrangle.validate(factory, opts);

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
 * Helpers:
 */
const wrangle = {
  validate(factory?: AnyFactory, opts: t.UseFactoryOptions = {}): t.UseFactoryValidateOptions {
    const v = opts.validate;

    // Explicit object → pass through unchanged (caller controls everything).
    if (v && typeof v === 'object') return v;

    // Shorthands:
    if (v === false) return { mode: 'never' };
    if (v === true || v === 'always') {
      const regs = factory?.getRegistrations?.();
      const validators = regs ? Schema.Props.makeValidators(regs) : undefined;
      return { mode: 'always', validators };
    }
    if (typeof v === 'string') return { mode: v };

    // Default: no validation.
    return { mode: 'never' };
  },
} as const;
