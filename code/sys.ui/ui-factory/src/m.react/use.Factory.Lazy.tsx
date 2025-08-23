import React from 'react';

import { type t } from './common.ts';
import { useEagerFactory } from './use.Factory.Eager.tsx';

/**
 * Lazy factory hook:
 * - Delegates data fetching/resolution to `useEagerFactory`.
 * - Exposes a `Lazy` component that can be wrapped in <Suspense /> by callers.
 * - Recreates `Lazy` when the resolved element changes or the optional key changes.
 */
export const useLazyFactory: t.UseLazyFactory = (factory, plan, opts) => {
  const { element, loading, error } = useEagerFactory(factory, plan, { key: opts?.key });

  /**
   * Hook:
   *    A lazily-loadable component that renders the latest resolved element.
   *    This resolves immediately (no real network suspense here); the caller
   *    can still wrap it in <Suspense fallback={...}> for consistency.
   */
  const Lazy = React.useMemo(() => {
    const Inner: React.FC = () => element ?? null;
    // NB: Resolve immediately to the current component;
    //     recreates on deps change.
    return React.lazy(async () => ({ default: Inner }));
  }, [element, opts?.key]);

  /**
   * API:
   */
  return { element, loading, error, Lazy };
};
