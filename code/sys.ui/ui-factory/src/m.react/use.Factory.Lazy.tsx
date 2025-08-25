import React from 'react';

import { type t } from './common.ts';
import { useEagerFactory } from './use.Factory.Eager.tsx';

/**
 * Suspense-friendly hook:
 * - Delegates resolution to `useEagerFactory`.
 * - Exposes a `Lazy` component you can wrap in <Suspense fallback={...}>.
 * - Recreates `Lazy` when the resolved element (or `key`) changes.
 */
export const useLazyFactory: t.UseLazyFactory = (factory, plan, opts = {}) => {
  const eager = useEagerFactory(factory, plan, opts);

  const Lazy = React.useMemo(() => {
    const Inner: React.FC = () => eager.element ?? null;
    return React.lazy(async () => ({ default: Inner }));
  }, [eager.element, opts?.key]);

  return { ...eager, Lazy };
};
