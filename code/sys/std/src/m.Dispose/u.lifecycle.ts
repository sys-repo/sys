import { type t, filter, take } from './common.ts';
import { disposable, disposableAsync, toDisposableAsyncArgs } from './u.dispose.ts';

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
