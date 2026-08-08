import { Delete, Err, Is, Subject, type t } from './common.ts';
import { done } from './u.done.ts';
import { requireSymbolAsyncDispose, requireSymbolDispose } from './u.native.ts';
import { until as untilObservables } from './u.until.ts';

type LifetimeBridge = ReturnType<t.Observable<unknown>['subscribe']>;
type LifetimeBridgeState = 'attaching' | 'live' | 'failed';
type AsyncDisposalState = 'idle' | 'running' | 'fulfilled' | 'rejected';

/**
 * Generates a generic disposable interface that is
 * typically mixed into a wider interface of some kind.
 */
export function disposable(until?: t.UntilInput): t.Disposable & globalThis.Disposable {
  requireSymbolDispose();
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
    [Symbol.dispose]() {
      dispose();
    },
    get dispose$() {
      return dispose$;
    },
  };
}

/**
 * Generates an asynchronous Disposable interface.
 */
export function disposableAsync(...args: any[]): t.DisposableAsync & globalThis.AsyncDisposable {
  requireSymbolAsyncDispose();
  const { until, onDispose } = toDisposableAsyncArgs(args);
  const dispose$ = new Subject<t.DisposeAsyncEvent>();
  const bridges = new Set<LifetimeBridge>();
  let state: AsyncDisposalState = 'idle';
  let completion: Promise<void> | undefined;

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

  const dispose: t.DisposableAsync['dispose'] = (reason) => {
    if (completion) return completion;

    const deferred = Promise.withResolvers<void>();
    completion = deferred.promise;
    state = 'running';

    const complete = () => {
      if (state !== 'running') return;
      fire('complete', reason);
      state = 'fulfilled';
      deferred.resolve();
    };
    const fail = (error: unknown) => {
      if (state !== 'running') return;
      fire('error', reason, asDisposeError(error));
      state = 'rejected';
      deferred.reject(error);
    };

    releaseLifetimeBridges(bridges);
    fire('start', reason);

    let result: unknown;
    try {
      // Invoke the cleanup handler in the requesting turn.
      result = onDispose?.({ reason });
    } catch (error) {
      fail(error);
      return completion;
    }

    if (result === completion) {
      fail(new TypeError('Asynchronous disposal cleanup cannot await its own completion'));
      return completion;
    }

    void settleAsyncResult(result, complete, fail);
    return completion;
  };

  const disposable: t.DisposableAsync & globalThis.AsyncDisposable = {
    dispose$: dispose$.asObservable(),
    dispose,
    [Symbol.asyncDispose]() {
      return dispose();
    },
  };

  attachLifetimeBridges(until, bridges, () => state !== 'idle', dispose);

  return disposable;
}

/**
 * Helpers:
 */
async function settleAsyncResult(
  result: unknown,
  onFulfilled: () => void,
  onRejected: (error: unknown) => void,
) {
  try {
    await result;
  } catch (error) {
    onRejected(error);
    return;
  }
  onFulfilled();
}

function asDisposeError(error: unknown): t.DisposeError {
  let cause: t.StdError | undefined;
  try {
    cause = Err.std(error);
  } catch {
    // Raw completion truth must survive opaque telemetry input.
  }

  return Delete.undefined({
    name: 'DisposeError',
    message: 'Failed while disposing asynchronously',
    cause,
  });
}

function attachLifetimeBridges(
  until: t.UntilInput | undefined,
  bridges: Set<LifetimeBridge>,
  hasDisposalStarted: () => boolean,
  request: (reason?: unknown) => void | Promise<void>,
) {
  let state: LifetimeBridgeState = 'attaching';

  try {
    for (const $ of untilObservables(until)) {
      const subscription = $.subscribe((event) => {
        const reason = (event as t.DisposeEvent | undefined)?.reason;
        const run = () => {
          if (state !== 'failed') ownLifetimeRequest(request, reason);
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

function ownLifetimeRequest(
  request: (reason?: unknown) => void | Promise<void>,
  reason?: unknown,
) {
  const result = request(reason);
  if (Is.promise(result)) void result.catch(() => undefined);
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
  let onDispose: t.LifecycleStageHandler | undefined;
  let untilInput: t.UntilObservable | undefined;

  if (typeof args[0] === 'function') onDispose = args[0];
  if (typeof args[1] === 'function') onDispose = args[1];
  if (Is.untilInput(args[0])) untilInput = untilObservables(args[0]);

  return { onDispose, until: untilInput };
}
