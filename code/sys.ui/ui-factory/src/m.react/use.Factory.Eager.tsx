import React from 'react';

import { type t, rx, Schedule, Schema, Time } from './common.ts';
import { renderPlan } from './u.renderPlan.ts';
import { validatePlan } from './u.validatePlan.ts';

type AnyFactory = t.ReactFactory<any, any>;
type Errors = t.UseFactoryValidateError[];

/**
 * Eagerly resolves (factory + plan) into a React element.
 * - No Suspense; returns { ok, element, loading, issues } directly.
 * - SSR: runs a synchronous validation pass (effects don't run on SSR).
 * - Client: still runs validation in an effect to stay reactive.
 */
export const useEagerFactory: t.UseEagerFactory = (factory, plan, opts = {}) => {
  const { key, debug = {}, disabled = false } = opts;

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
  const initialValidation = React.useMemo<Errors | undefined>(() => {
    if (disabled) return;
    if (!factory || !plan) return;
    const v = normalizedValidate;
    if (v.mode !== 'always' || !v.validators) return;

    const collected: t.UseFactoryValidateError[] = [];
    const isSSR = typeof window === 'undefined' || typeof document === 'undefined';
    const onError = (e: t.UseFactoryValidateError) => {
      collected.push(e);
      if (isSSR) v.onError?.(e); // SSR-only: fire callbacks immediately.
    };

    validatePlan(plan as any, v.validators, { ...v, onError });
    if (collected.length && isSSR) v.onErrors?.(collected);

    return collected;
  }, [factory, plan, normalizedValidate, disabled]);

  /**
   * State
   */
  const [element, setElement] = React.useState<React.ReactElement | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [runtime, setRuntime] = React.useState<Error | undefined>(undefined);
  const [validation, setValidation] = React.useState<Errors | undefined>(initialValidation);

  /**
   * Effect: resolve element and (re)run validation on the client.
   */
  React.useEffect(() => {
    const resetState = () => {
      setElement(null);
      setLoading(false);
      setRuntime(undefined);
      setValidation([]);
    };

    if (disabled) return void resetState();
    if (!factory || !plan) return void resetState();

    const life = rx.abortable();
    const abort = life.controller.signal;
    setLoading(true);
    setRuntime(undefined);
    setValidation(initialValidation);

    (async () => {
      try {
        // Yield a frame so `loading=true` can render.
        await Schedule.frames(2);
        if (life.disposed) return;

        // Debug: load delay.
        const delay = Math.max(0, (debug as { delay?: number } | undefined)?.delay ?? 0);
        if (delay > 0) {
          await Time.until(life).wait(delay);
          if (life.disposed) return;
        }

        const el = await resolveElement(factory, plan);
        if (life.disposed) return;

        let collected: t.UseFactoryValidateError[] = [];
        const v = normalizedValidate;
        if (v.mode === 'always' && v.validators) collected = collectValidation(plan, v);
        if (life.disposed) return;

        setValidation(collected);
        setElement(el);
        setLoading(false);
      } catch (err) {
        if (!life.disposed) {
          setElement(null);
          setLoading(false);
          setRuntime(err as Error);
        }
      }
    })();

    return life.dispose;
  }, [factory, plan, key, normalizedValidate, initialValidation, debug?.delay, disabled]);

  /**
   * API:
   */
  const issues = React.useMemo(
    () => (disabled ? { runtime: undefined, validation: undefined } : { runtime, validation }),
    [disabled, runtime, validation],
  );

  return {
    ok: disabled ? true : !runtime,
    element: disabled ? null : element,
    loading: disabled ? false : loading,
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
    onError(e) {
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
