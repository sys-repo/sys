import { type t, filter, take } from './common.ts';
import { disposable, disposableAsync, toDisposableAsyncArgs } from './u.dispose.ts';

type L = t.Lifecycle;

/**
 * Generates a disposable interface that maintains
 * and exposes it's disposed state.
 */
export function lifecycle(until$?: t.UntilInput) {
  const { dispose, dispose$ } = disposable(until$);
  let _disposed = false;
  dispose$.pipe(take(1)).subscribe(() => (_disposed = true));
  return {
    dispose,
    get dispose$() {
      return dispose$;
    },
    get disposed() {
      return _disposed;
    },
  };
}

/**
 * An async variant of the lifecycle pattern.
 */
export function lifecycleAsync(...args: any[]) {
  const { until$, onDispose } = toDisposableAsyncArgs(args);
  const { dispose, dispose$ } = disposableAsync(until$, onDispose);
  let _disposed = false;
  dispose$
    .pipe(
      filter((e) => e.payload.stage === 'complete' || e.payload.stage === 'error'),
      take(1),
    )
    .subscribe(() => (_disposed = true));
  return {
    dispose$,
    dispose,
    get disposed() {
      return _disposed;
    },
  };
}

/**
 * Extend the given object to expose the lifecycle API.
 */
export const toLifecycle: t.DisposeLib['toLifecycle'] = <T extends L>(...input: any[]): T => {
  const { api, life } = wrangle.toLifecycleParams(input);
  const obj = api as T & L;

  Object.defineProperties(obj, {
    dispose: {
      value: life.dispose.bind(life),
      enumerable: true,
    },
    dispose$: {
      get: () => life.dispose$,
      enumerable: true,
    },
    disposed: {
      get: () => life.disposed,
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
