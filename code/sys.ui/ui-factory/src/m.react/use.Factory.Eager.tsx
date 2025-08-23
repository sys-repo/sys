import React from 'react';

import { type t } from './common.ts';
import { renderPlan } from './u.renderPlan.ts';

/**
 * Eagerly resolves (plan, factory) into a React element.
 * - No Suspense; you get { element, loading, error } directly.
 * - Re-runs when factory, plan, or opts.key change.
 */
export const useEagerFactory: t.UseEagerFactory = (factory, plan, opts) => {
  /**
   * Hooks:
   */
  const [element, setElement] = React.useState<React.ReactElement | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  /**
   * Effect:
   */
  React.useEffect(() => {
    // If inputs are missing, reset and bail.
    if (!factory || !plan) {
      setElement(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function init() {
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
    }

    init();
    return () => void (cancelled = true);
  }, [factory, plan, opts?.key]);

  /**
   * API:
   */
  const api: t.UseEagerFactoryResult = { element, loading, error };
  return api;
};
