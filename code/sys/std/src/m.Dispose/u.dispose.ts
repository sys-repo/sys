import { Delete, Err, Is, Subject, type t } from './common.ts';
import { done } from './u.done.ts';
import { until as untilObservables } from './u.until.ts';

/**
 * Generates a generic disposable interface that is
 * typically mixed into a wider interface of some kind.
 */
export function disposable(until?: t.UntilInput): t.Disposable {
  const subject$ = new Subject<t.DisposeEvent>();
  const dispose$ = subject$.asObservable();

  let disposed = false;
  const bridges = new Set<{ unsubscribe(): void }>();

  const dispose: t.Disposable['dispose'] = (reason) => {
    if (disposed) return; // idempotent
    disposed = true;

    // Tear down any external lifetime bridges.
    for (const s of bridges) {
      try {
        s.unsubscribe();
      } catch {}
    }
    bridges.clear();

    // Emit and complete.
    done(subject$, reason);
  };

  // Bridge external lifetimes into this disposable.
  // Assumes `untilObservables(until)` → Iterable<Observable<DisposeEvent>>.
  for (const $ of untilObservables(until)) {
    type T = t.DisposeEvent | undefined;
    const sub = $.subscribe((e) => dispose((e as T)?.reason));
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
  const { until, onDispose } = toDisposableAsyncArgs(args);
  const dispose$ = new Subject<t.DisposeAsyncEvent>();
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

  const bridges = new Set<{ unsubscribe(): void }>();
  const dispose = disposable.dispose;
  disposable.dispose = async (reason) => {
    for (const bridge of bridges) {
      try {
        bridge.unsubscribe();
      } catch {}
    }
    bridges.clear();
    await dispose(reason);
  };

  // Bridge external lifetimes into this disposable.
  // Assumes `untilObservables(until)` → Iterable<Observable<DisposeEvent>>.
  for (const $ of untilObservables(until)) {
    const sub = $.subscribe((e) => disposable.dispose((e as t.DisposeEvent | undefined)?.reason));
    bridges.add(sub);
  }

  return disposable;
}

/**
 * Helpers:
 */
export function toDisposableAsyncArgs(args: any[]) {
  type Fn = (e: t.DisposeEvent) => Promise<void>;
  let onDispose: Fn | undefined;
  let untilInput: t.UntilObservable | undefined;

  if (typeof args[0] === 'function') onDispose = args[0];
  if (typeof args[1] === 'function') onDispose = args[1];
  if (Is.untilInput(args[0])) untilInput = untilObservables(args[0]);

  return { onDispose, until: untilInput };
}
