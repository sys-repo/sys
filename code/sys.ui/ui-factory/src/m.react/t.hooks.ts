import type React from 'react';
import type { t } from './common.ts';

/**
 * Eager hook: resolve (plan, factory) immediately and return an element + state.
 */
export type UseEagerFactoryOptions = {
  /** Force remount/reload when this changes (useful for dev toggles / re-run). */
  key?: React.Key;
  /** Validate against schema. */
  validate?: UseFactoryValidate;
  /** Debug sub-options. */
  debug?: UseFactoryDebug;
};

export type UseEagerFactoryResult = {
  readonly ok: boolean; // true iff no fatal runtime error
  readonly element: React.ReactElement | null; // null while loading or when !ok
  readonly loading: boolean;

  /** Collected problems for this pass. */
  readonly issues: {
    /** Fatal render/resolve exception (sets ok=false). */
    readonly runtime?: Error;

    /** Non-fatal schema/plan violations; empty if none. */
    readonly validation: readonly UseFactoryValidateError[];
  };
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

export type UseLazyFactoryOptions = t.UseEagerFactoryOptions;

/** Signature for the lazy hook implementation. */
export type UseLazyFactory = <F extends t.ReactFactory<any, any>>(
  factory: F | undefined,
  plan: t.Plan<F> | undefined,
  opts?: UseLazyFactoryOptions,
) => UseLazyFactoryResult;

/**
 * Validation error produced while walking a plan.
 * Extends the canonical validation error with the view `id`.
 */
export type UseFactoryValidateError<V extends t.ViewId = string> = t.ValidationError & { id: V };

/** When to run plan/props validation. */
export type UseFactoryValidateMode = 'always' | 'never';

/** Hook options. */
export type UseFactoryValidateOptions = {
  /** Default: 'never' (explicit opt-in for runtime work). */
  mode?: UseFactoryValidateMode;

  /** Optional prebuilt per-id validators map. */
  validators?: t.PropsValidators<any>;

  /** Per-error callback. */
  onError?: (err: UseFactoryValidateError) => void;

  /** Batched callback with all errors from a pass. */
  onErrors?: (errs: UseFactoryValidateError[]) => void;

  /** Stop on first invalid node (default: false). */
  failFast?: boolean;
};

/** Shorthand:
 *   - `true`  → { mode: 'always' }
 *   - `false` → { mode: 'never' }
 *   - `{ ... }` passes options through unchanged
 */
export type UseFactoryValidate = boolean | UseFactoryValidateMode | UseFactoryValidateOptions;

/**
 * Unified hook options:
 * - 'eager'    (default): resolve immediately and return { element, loading, error }.
 * - 'suspense': wrap the resolved element in <Suspense fallback={...}> and still
 *               return the eager fields for consistency.
 * - `validate`: optional plan/props validation controls (applies to both strategies).
 */
export type UseFactoryOptions =
  | ({
      strategy?: 'eager';
      validate?: UseFactoryValidate;
      debug?: UseFactoryDebug;
    } & UseEagerFactoryOptions)
  | ({
      strategy: 'suspense';
      validate?: UseFactoryValidate;
      fallback?: React.ReactNode;
      debug?: UseFactoryDebug;
    } & UseLazyFactoryOptions);

/** Debug options. */
export type UseFactoryDebug = {
  /** Artificial delay (ms) before resolving/rendering, for test/simulation. */
  readonly delay?: t.Msecs;
};

/** Hook instance returned from the `useFactory` hook: */
export type UseFactoryResult = UseEagerFactoryResult | UseLazyFactoryResult;

/** Signature for the unified hook implementation. */
export type UseFactory = <F extends t.ReactFactory<any, any>>(
  factory: F | undefined,
  plan: t.Plan<F> | undefined,
  opts?: UseFactoryOptions,
) => UseFactoryResult;
