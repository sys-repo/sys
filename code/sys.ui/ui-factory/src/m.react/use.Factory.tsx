import { type t } from './common.ts';
import { useEagerFactory } from './use.Factory.Eager.tsx';
import { useLazyFactory } from './use.Factory.Lazy.tsx';

/**
 * Unified factory hook:
 * - strategy: 'eager' (default): resolves immediately (no Suspense).
 * - strategy: 'suspense': returns a `Lazy` component to be used within <Suspense>.
 * - Re-runs when `factory`, `plan`, or `opts.key` change.
 */
export const useFactory: t.UseFactory = (factory, plan, opts) => {
  const strategy = opts?.strategy ?? 'eager';
  return strategy === 'suspense'
    ? useLazyFactory(factory as any, plan as any, { key: opts?.key })
    : useEagerFactory(factory as any, plan as any, { key: opts?.key });
};
