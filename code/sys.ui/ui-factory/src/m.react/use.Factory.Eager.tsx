import React from 'react';

import { type t, Schema } from './common.ts';
import { renderPlan } from './u.renderPlan.ts';
import { validatePlan } from './u.validatePlan.ts';

type AnyFactory = t.ReactFactory<any, any>;
type ValidationErrors = t.UseFactoryValidateError;

/**
 * Eagerly resolves (factory + plan) into a React element.
 * - No Suspense; returns { ok, element, loading, issues } directly.
 * - SSR: runs a synchronous validation pass (effects don't run on SSR).
 * - Client: still runs validation in an effect to stay reactive.
 */
export const useEagerFactory: t.UseEagerFactory = (factory, plan, opts) => {
  const key = opts?.key;

  /**
   * Normalize validation options once (stable across both SSR and client).
   * Note: we accept an object with { validate?: ... } so it works with both
   * eager/unified option shapes without widening types.
   */
  const normalizedValidate = React.useMemo<t.UseFactoryValidateOptions>(() => {
    const v = (opts as { validate?: t.UseFactoryValidate } | undefined)?.validate;

    if (v && typeof v === 'object') return v;
    if (v === false) return { mode: 'never' };

    if (v === true || v === 'always') {
      const regs = factory?.getRegistrations?.();
      const validators = regs ? Schema.Props.makeValidators(regs) : undefined;
      return { mode: 'always', validators };
    }

    if (typeof v === 'string') return { mode: v as 'never' | 'always' };
    return { mode: 'never' };
  }, [factory, (opts as any)?.validate]);

  /**
   * Synchronous validation pass (runs during render too, e.g. SSR).
   *
   * - Collects errors immediately.
   * - In SSR (no client effects), also fires user callbacks inline.
   * - In CSR (browser), callbacks fire later inside the effect, so this
   *   stays side-effect free during render.
   */
  const initialValidation = React.useMemo<t.UseFactoryValidateError[]>(() => {
    if (!factory || !plan) return [];
    const v = normalizedValidate;
    if (v.mode !== 'always' || !v.validators) return [];

    const collected: t.UseFactoryValidateError[] = [];
    const isSSR = typeof window === 'undefined' || typeof document === 'undefined';
    const onError = (e: t.UseFactoryValidateError) => {
      collected.push(e);
      if (isSSR) v.onError?.(e); // SSR-only: fire callbacks immediately
    };

    validatePlan(plan as any, v.validators, { ...v, onError });
    if (collected.length && isSSR) v.onErrors?.(collected);

    return collected;
  }, [factory, plan, normalizedValidate]);

  /**
   * State
   */
  const [element, setElement] = React.useState<React.ReactElement | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [runtime, setRuntime] = React.useState<Error | undefined>(undefined);
  const [validation, setValidation] =
    React.useState<t.UseFactoryValidateError[]>(initialValidation);

  /**
   * Effect: resolve element and (re)run validation on the client.
   */
  React.useEffect(() => {
    if (!factory || !plan) {
      setElement(null);
      setLoading(false);
      setRuntime(undefined);
      setValidation([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setRuntime(undefined);
    setValidation(initialValidation);

    (async () => {
      try {
        // Yield a frame so `loading=true` can render
        if (cancelled) return;

        const el = await resolveElement(factory, plan);
        if (cancelled) return;

        let collected: t.UseFactoryValidateError[] = [];
        const v = normalizedValidate;
        if (v.mode === 'always' && v.validators) collected = collectValidation(plan, v);
        if (cancelled) return;

        setValidation(collected);
        setElement(el);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setElement(null);
          setLoading(false);
          setRuntime(err as Error);
        }
      }
    })();

    return () => void (cancelled = true);
  }, [factory, plan, key, normalizedValidate, initialValidation]);

  /**
   * API:
   */
  const issues = React.useMemo(() => ({ runtime, validation }), [runtime, validation]);
  return {
    ok: !runtime,
    element,
    loading,
    issues,
  };
};

/**
 * Helpers:
 */
function collectValidation<F extends AnyFactory>(plan: t.Plan<F>, v: t.UseFactoryValidateOptions) {
  const out: t.UseFactoryValidateError[] = [];
  validatePlan(plan as any, v.validators!, {
    ...v,
    onError: (e) => {
      out.push(e);
      v.onError?.(e);
    },
  });
  if (out.length && v.onErrors) v.onErrors(out);
  return out;
}

async function resolveElement<F extends AnyFactory>(factory: F, plan: t.Plan<F>) {
  return renderPlan(plan, factory);
}
