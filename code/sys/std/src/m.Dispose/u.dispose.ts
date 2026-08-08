import { Delete, Err, Is, Subject, type t } from './common.ts';
import { done } from './u.done.ts';
import { until as untilObservables } from './u.until.ts';

type LifetimeBridge = ReturnType<t.Observable<unknown>['subscribe']>;
type LifetimeBridgeState = 'attaching' | 'live' | 'failed';

/**
 * Generates a generic disposable interface that is
 * typically mixed into a wider interface of some kind.
 */
export function disposable(until?: t.UntilInput): t.Disposable {
  const subject$ = new Subject<t.DisposeEvent>();
  const dispose$ = subject$.asObservable();

  let disposed = false;
  const bridges = new Set<LifetimeBridge>();

  const dispose: t.Disposable['dispose'] = (reason) => {
    if (disposed) return; // idempotent
    disposed = true;

    releaseLifetimeBridges(bridges);
    done(subject$, reason);
  };

  attachLifetimeBridges(until, bridges, () => disposed, dispose);

  return {
    dispose,
    get dispose$() {
      return dispose$;
    },
  };
}

/**
 * Generates an asynchronous Disposable interface.
 */
export function disposableAsync(...args: any[]) {
  const { until, onDispose } = toDisposableAsyncArgs(args);
  const dispose$ = new Subject<t.DisposeAsyncEvent>();
  const bridges = new Set<LifetimeBridge>();
  let _disposing = false;

  type P = t.DisposeAsyncEventArgs;
  const asPayload = (stage: t.DisposeAsyncStage, reason?: unknown, error?: t.DisposeError): P => {
    const ok = !error;
    const done = stage === 'complete' || stage === 'error';
    return Delete.undefined({ stage, is: { ok, done }, reason, error });
  };
  const fire = (stage: t.DisposeAsyncStage, reason?: unknown, error?: t.DisposeError) => {
    const payload = asPayload(stage, reason, error);
    dispose$.next({ type: 'dispose', payload });
  };

  const disposable: t.DisposableAsync = {
    dispose$: dispose$.asObservable(),
    async dispose(reason) {
      if (_disposing) return; // idempotent
      _disposing = true;

      releaseLifetimeBridges(bridges);
      fire('start', reason);
      try {
        // Invoke handler ("clean up resources").
        // Pass a structured event with the optional disposal reason.
        await onDispose?.({ reason });
        fire('complete', reason);
      } catch (err: any) {
        fire('error', reason, {
          name: 'DisposeError',
          message: 'Failed while disposing asynchronously',
          cause: Err.std(err),
        });
      }
    },
  };

  attachLifetimeBridges(until, bridges, () => _disposing, disposable.dispose);

  return disposable;
}

/**
 * Helpers:
 */
function attachLifetimeBridges(
  until: t.UntilInput | undefined,
  bridges: Set<LifetimeBridge>,
  hasDisposalStarted: () => boolean,
  request: (reason?: unknown) => void,
) {
  let state: LifetimeBridgeState = 'attaching';

  try {
    for (const $ of untilObservables(until)) {
      const subscription = $.subscribe((event) => {
        const reason = (event as t.DisposeEvent | undefined)?.reason;
        const run = () => {
          if (state !== 'failed') request(reason);
        };

        if (state === 'attaching') queueMicrotask(run);
        else run();
      });

      if (hasDisposalStarted() || subscription.closed) releaseLifetimeBridge(subscription);
      else bridges.add(subscription);
    }
    state = 'live';
  } catch (error) {
    state = 'failed';
    releaseLifetimeBridges(bridges);
    throw error;
  }
}

function releaseLifetimeBridge(bridge: LifetimeBridge) {
  try {
    bridge.unsubscribe();
  } catch {
    /* Best-effort bridge teardown. */
  }
}

function releaseLifetimeBridges(bridges: Set<LifetimeBridge>) {
  for (const bridge of bridges) releaseLifetimeBridge(bridge);
  bridges.clear();
}

export function toDisposableAsyncArgs(args: any[]) {
  type Fn = (e: t.DisposeEvent) => Promise<void>;
  let onDispose: Fn | undefined;
  let untilInput: t.UntilObservable | undefined;

  if (typeof args[0] === 'function') onDispose = args[0];
  if (typeof args[1] === 'function') onDispose = args[1];
  if (Is.untilInput(args[0])) untilInput = untilObservables(args[0]);

  return { onDispose, until: untilInput };
}
