import { type t, Delete, Err, Is, Subject } from './common.ts';
import { done } from './u.done.ts';
import { until } from './u.until.ts';

/**
 * Generates a generic disposable interface that is
 * typically mixed into a wider interface of some kind.
 */
export function disposable(until$?: t.UntilInput): t.Disposable {
  const subject$ = new Subject<t.DisposeEvent>();
  const dispose$ = subject$.asObservable();

  let disposed = false;
  const bridges = new Set<{ unsubscribe(): void }>();

  const dispose: t.Disposable['dispose'] = (reason) => {
    if (disposed) return; // idempotent
    disposed = true;

    // Tear down any external lifetime bridges.
    for (const s of bridges)
      try {
        s.unsubscribe();
      } catch {}
    bridges.clear();

    // Emit and complete.
    done(subject$, reason);
  };

  // Bridge external lifetimes into this disposable.
  // Assumes `until(until$)` → Iterable<Observable<DisposeEvent>>.
  for (const $ of until(until$)) {
    const sub = $.subscribe(dispose);
    bridges.add(sub);
  }

  return {
    dispose,
    get dispose$() {
      return dispose$;
    },
  };
}

/**
 * Generates an asnchronous Disposable interface.
 */
export function disposableAsync(...args: any[]) {
  const { until$, onDispose } = toDisposableAsyncArgs(args);
  const dispose$ = new Subject<t.DisposeAsyncEvent>();
  let _disposing = false;

  type P = t.DisposeAsyncEventArgs;
  const asPayload = (stage: t.DisposeAsyncStage, error?: t.DisposeError): P => {
    const ok = !error;
    const done = stage === 'complete' || stage === 'error';
    return Delete.undefined({ stage, is: { ok, done }, error });
  };
  const fire = (stage: t.DisposeAsyncStage, error?: t.DisposeError) => {
    const payload = asPayload(stage, error);
    dispose$.next({ type: 'dispose', payload });
  };

  const disposable: t.DisposableAsync = {
    dispose$: dispose$.asObservable(),
    async dispose() {
      if (_disposing) return;
      _disposing = true;

      fire('start');
      try {
        await onDispose?.(); // Invoke handler ("clean up resources").
        fire('complete');
      } catch (err: any) {
        fire('error', {
          name: 'DisposeError',
          message: 'Failed while disposing asynchronously',
          cause: Err.std(err),
        });
      }
    },
  };

  until(until$).forEach(($) => $.subscribe(disposable.dispose));
  return disposable;
}

/**
 * Helpers
 */
export function toDisposableAsyncArgs(args: any[]) {
  type Fn = () => Promise<void>;
  let onDispose: Fn | undefined;
  let until$: t.UntilObservable | undefined;

  if (typeof args[0] === 'function') onDispose = args[0];
  if (typeof args[1] === 'function') onDispose = args[1];
  if (Is.observable(args[0]) || Array.isArray(args[0]) || Is.disposable(args[0])) {
    until$ = until(args[0]);
  }

  return { onDispose, until$ };
}
