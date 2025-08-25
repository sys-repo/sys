import React from 'react';

import { type t, Schema } from './common.ts';
import { validatePlan } from './u.validatePlan.ts';
import { useEagerFactory } from './use.Factory.Eager.tsx';

type AnyFactory = t.Factory<any, any>;

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
  const { key, strategy = 'eager' } = opts;

  // Resolve once eagerly to keep hooks stable.
  const eager = useEagerFactory<F>(factory, plan, { key });
  const { ok: eagerOk, element, loading, issues: eagerIssues } = eager;

  // Optional: validation pass (no side-effects on render tree).
  const validate = wrangle.validate(factory, opts);

  // Collect validation problems locally so the hook can return them.
  const validation: t.UseFactoryValidateError[] = [];

  if (factory && plan && validate && validate.mode === 'always' && validate.validators) {
    // Wrap user callbacks to both forward + collect.
    const onError = (e: t.UseFactoryValidateError) => {
      validation.push(e);
      validate.onError?.(e);
    };

    // Traverse the plan and validate props
    validatePlan(plan as any, validate.validators, { ...validate, onError });

    // Batch callback after full pass
    if (validation.length && validate.onErrors) validate.onErrors(validation);
  }

  // Merge eager runtime issue with newly collected validation issues.
  const ok = eagerOk; // ok reflects runtime success; validation issues are surfaced separately
  const issues = { runtime: eagerIssues.runtime, validation } as const;

  if (strategy === 'suspense') {
    const fallback = 'fallback' in (opts as any) ? (opts as any).fallback : null;
    return {
      ok,
      element: <React.Suspense fallback={fallback}>{element}</React.Suspense>,
      loading,
      issues,
    };
  }

  // Eager passthrough.
  return { ok, element, loading, issues };
}

/**
 * Helpers:
 */
const wrangle = {
  /**
   * Normalize shorthand + optionally derive validators from the factory.
   *  - false         → { mode: 'never' }
   *  - true/'always' → { mode: 'always', validators: derived-if-possible }
   *  - 'never'       → { mode: 'never' }
   *  - object        → passthrough
   */
  validate(factory?: AnyFactory, opts: t.UseFactoryOptions = {}): t.UseFactoryValidateOptions {
    const v = opts.validate;

    // Explicit object → pass through unchanged (caller controls everything)
    if (v && typeof v === 'object') return v;

    // Shorthands
    if (v === false) return { mode: 'never' };

    if (v === true || v === 'always') {
      const regs = factory?.getRegistrations?.();
      const validators = regs ? Schema.Props.makeValidators(regs) : undefined;
      return { mode: 'always', validators };
    }

    if (typeof v === 'string') return { mode: v };

    // Default: no validation
    return { mode: 'never' };
  },
} as const;
