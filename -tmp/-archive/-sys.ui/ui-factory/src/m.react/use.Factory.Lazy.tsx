import React from 'react';

import { type t } from './common.ts';
import { useEagerFactory } from './use.Factory.Eager.tsx';

/**
 * Suspense-friendly hook:
 * - Delegates resolution to `useEagerFactory`.
 * - Exposes a `Lazy` component you can wrap in <Suspense fallback={...}>.
 * - Recreates `Lazy` when the resolved element, `disabled`, or `key` changes.
 */
export const useLazyFactory: t.UseLazyFactory = (factory, plan, opts = {}) => {
  const eager = useEagerFactory(factory, plan, opts);
  const { disabled = false } = opts as t.UseLazyFactoryOptions;

  const Lazy = React.useMemo(() => {
    // When disabled, provide a no-op component.
    const Inner: React.FC = disabled ? () => null : () => eager.element ?? null;

    // Resolve immediately; React.lazy still goes through its async gate,
    // but the promise resolves in the same tick (no real work when disabled).
    return React.lazy(async () => ({ default: Inner }));
  }, [disabled, eager.element, (opts as { key?: React.Key }).key]);

  return { ...eager, Lazy };
};
