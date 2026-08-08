import { filter, type t, take } from './common.ts';
import { disposable, disposableAsync, toDisposableAsyncArgs } from './u.dispose.ts';
import { requireSymbolAsyncDispose, requireSymbolDispose } from './u.native.ts';

type L = t.Lifecycle;

/**
 * Generates a disposable interface that maintains
 * and exposes it's disposed state.
 */
export function lifecycle(until?: t.UntilInput): t.Lifecycle & globalThis.Disposable {
  requireSymbolDispose();
  const owner = disposable(until);
  let _disposed = false;
  owner.dispose$.pipe(take(1)).subscribe(() => (_disposed = true));
  return {
    dispose: owner.dispose,
    [Symbol.dispose]: owner[Symbol.dispose],
    get dispose$() {
      return owner.dispose$;
    },
    get disposed() {
      return _disposed;
    },
  };
}

/**
 * An async variant of the lifecycle pattern.
 */
export function lifecycleAsync(...args: any[]): t.LifecycleAsync & globalThis.AsyncDisposable {
  requireSymbolAsyncDispose();
  const { until, onDispose } = toDisposableAsyncArgs(args);
  const owner = disposableAsync(until, onDispose);
  let _disposed = false;
  owner.dispose$
    .pipe(
      filter((e) => e.payload.stage === 'complete' || e.payload.stage === 'error'),
      take(1),
    )
    .subscribe(() => (_disposed = true));
  return {
    dispose$: owner.dispose$,
    dispose: owner.dispose,
    [Symbol.asyncDispose]: owner[Symbol.asyncDispose],
    get disposed() {
      return _disposed;
    },
  };
}

/**
 * Extend the given object to expose the lifecycle API.
 */
export const toLifecycle: t.Dispose.Lib['toLifecycle'] = <T extends L>(
  ...input: any[]
): T & globalThis.Disposable => {
  requireSymbolDispose();
  const { api, life } = wrangle.toLifecycleParams(input);
  const obj = api as T & L & globalThis.Disposable;
  const dispose = life.dispose.bind(life);

  Object.defineProperties(obj, {
    dispose: {
      value: dispose,
      enumerable: true,
    },
    [Symbol.dispose]: {
      value: () => dispose(),
      enumerable: true,
    },
    disposed: {
      get: () => life.disposed,
      enumerable: true,
    },
    dispose$: {
      get: () => life.dispose$,
      enumerable: true,
    },
  });

  return obj;
};

/**
 * Extend the given object to expose the lifecycle view (no dispose).
 */
export const toLifecycleView: t.Dispose.Lib['toLifecycleView'] = <T extends t.LifecycleView>(
  life: t.Lifecycle,
  api: t.OmitLifecycle<T>,
): T => {
  const obj = api as T & t.LifecycleView;

  Object.defineProperties(obj, {
    disposed: {
      get: () => life.disposed,
      enumerable: true,
    },
    dispose$: {
      get: () => life.dispose$,
      enumerable: true,
    },
  });

  return obj;
};

/**
 * Helpers
 */
const wrangle = {
  toLifecycleParams<T extends t.Lifecycle>(input: any[]): { life: t.Lifecycle; api: T } {
    if (input.length === 1) return { life: lifecycle(), api: input[0] as T };
    if (input.length >= 2) return { life: input[0], api: input[1] };
    throw new Error('Failed to parse overloads: toLifecycle');
  },
} as const;
