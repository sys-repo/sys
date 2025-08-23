import type React from 'react';
import type { t } from './common.ts';

/**
 * Eager hook: resolve (plan, factory) immediately and return an element + state.
 */
export type UseEagerFactoryOptions = {
  /** Force remount/reload when this changes (useful for dev toggles / re-run). */
  key?: React.Key;
};

export type UseEagerFactoryResult = {
  /** The resolved React element (null while loading or on error). */
  element: React.ReactElement | null;
  /** True while the plan is being resolved. */
  loading: boolean;
  /** Non-null if resolution failed. */
  error: Error | null;
};

/** Signature for the eager hook implementation. */
export type UseEagerFactory = <F extends t.ReactFactory<any, any>>(
  factory: F | undefined,
  plan: t.Plan<F> | undefined,
  opts?: UseEagerFactoryOptions,
) => UseEagerFactoryResult;

/**
 * Suspense-friendly hook: exposes a lazily-renderable component while also
 * returning the eager shape for observability (element/loading/error).
 */
export type UseLazyFactoryResult = UseEagerFactoryResult & {
  /** Component to render; wrap in <Suspense fallback={...}>. */
  Lazy: React.LazyExoticComponent<React.ComponentType<{}>>;
};

export type UseLazyFactoryOptions = {
  /** Force a new lazy boundary when this changes. */
  key?: React.Key;
};

/** Signature for the lazy hook implementation. */
export type UseLazyFactory = <F extends t.ReactFactory<any, any>>(
  factory: F | undefined,
  plan: t.Plan<F> | undefined,
  opts?: UseLazyFactoryOptions,
) => UseLazyFactoryResult;

/**
 * Unified hook: choose eager or suspense strategies.
 * - 'eager' (default): returns the eager shape.
 * - 'suspense': returns the lazy shape (which also includes eager fields).
 */
export type UseFactoryOptions =
  | ({ strategy?: 'eager' } & UseEagerFactoryOptions)
  | ({ strategy: 'suspense'; fallback?: React.ReactNode } & UseLazyFactoryOptions);

export type UseFactoryResult = UseEagerFactoryResult | UseLazyFactoryResult;

/** Signature for the unified hook implementation. */
export type UseFactory = <F extends t.ReactFactory<any, any>>(
  factory: F | undefined,
  plan: t.Plan<F> | undefined,
  opts?: UseFactoryOptions,
) => UseFactoryResult;
