import React from 'react';

import { type t } from './common.ts';
import { renderPlan } from './u.renderPlan.ts';

/**
 * Eagerly resolves (factory + plan) into a React element.
 * - No Suspense; returns { ok, element, loading, issues } directly.
 * - Re-runs when factory, plan, or opts.key change.
 * - Validation is handled by the parent `useFactory` (this hook only sets runtime issues).
 */
export const useEagerFactory: t.UseEagerFactory = (factory, plan, opts) => {
  const [element, setElement] = React.useState<React.ReactElement | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!factory || !plan) {
      setElement(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const el = await renderPlan(plan as any, factory as any);
        if (!cancelled) {
          setElement(el);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setElement(null);
          setLoading(false);
          setError(err as Error);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [factory, plan, opts?.key]);

  const ok = !error;
  const issues = {
    runtime: error ?? undefined,
    validation: [] as t.UseFactoryValidateError[],
  } as const;

  const api: t.UseEagerFactoryResult = { ok, element, loading, issues };
  return api;
};
