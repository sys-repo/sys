import { type t, Delete, Err, Is, Subject } from './common.ts';
import { done } from './u.done.ts';
import { until } from './u.until.ts';

/**
 * Generates a generic disposable interface that is
 * typically mixed into a wider interface of some kind.
 */
export function disposable(until$?: t.UntilInput) {
  const subject$ = new Subject<void>();
  const dispose$ = subject$.asObservable();
  const disposable: t.Disposable = {
    dispose: () => done(subject$),
    get dispose$() {
      return dispose$;
    },
  };
  until(until$).forEach(($) => $.subscribe(disposable.dispose));
  return disposable;
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
  if (Is.observable(args[0]) || Array.isArray(args[0])) until$ = until(args[0]);

  return { onDispose, until$ };
}
