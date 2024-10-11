import { Is } from '../m.Observable/m.Rx.Is.ts';
import { Subject, filter, flatten, take, type t } from './common.ts';
import { Err } from '../m.Err/mod.ts';
import { Delete } from '../m.Delete/mod.ts';

/**
 * Toolkit for working with disposable interfaces.
 */
export const Dispose: t.DisposeLib = {
  /**
   * Generates a generic disposable interface that is
   * typically mixed into a wider interface of some kind.
   */
  disposable(until$): t.Disposable {
    const dispose$ = new Subject<void>();
    const disposable: t.Disposable = {
      dispose$: dispose$.asObservable(),
      dispose: () => Dispose.done(dispose$),
    };
    Dispose.until(until$).forEach(($) => $.subscribe(disposable.dispose));
    return disposable;
  },

  /**
   * Generates an asnchronous Disposable interface.
   */
  disposableAsync(...args: any[]) {
    const { until$, onDispose } = wrangle.disposableAsyncArgs(args);
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
            cause: Err.stdError(err),
          });
        }
      },
    };

    Dispose.until(until$).forEach(($) => $.subscribe(disposable.dispose));
    return disposable;
  },

  /**
   * Generates a disposable interface that maintains
   * and exposes it's disposed state.
   */
  lifecycle(until$) {
    const { dispose, dispose$ } = Dispose.disposable(until$);
    let _disposed = false;
    dispose$.pipe(take(1)).subscribe(() => (_disposed = true));
    return {
      dispose$,
      dispose,
      get disposed() {
        return _disposed;
      },
    };
  },

  lifecycleAsync(...args) {
    const { until$, onDispose } = wrangle.disposableAsyncArgs(args);
    const { dispose, dispose$ } = Dispose.disposableAsync(until$, onDispose);
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
  },

  /**
   * Listens to an observable (or set of observbles) and
   * disposes of the target when any of them fire.
   */
  until($) {
    const list = Array.isArray($) ? $ : [$];
    return flatten(list).filter(Boolean);
  },

  /**
   * "Completes" a subject by running:
   *
   *    1. subject.next();
   *    2. subject.complete();
   */
  done(dispose$) {
    dispose$?.next?.();
    dispose$?.complete?.();
  },
};

/**
 * Helpers
 */
export const wrangle = {
  disposableAsyncArgs(args: any[]) {
    type Fn = () => Promise<void>;
    let onDispose: Fn | undefined;
    let until$: t.UntilObservable | undefined;

    if (typeof args[0] === 'function') onDispose = args[0];
    if (typeof args[1] === 'function') onDispose = args[1];
    if (Is.observable(args[0]) || Array.isArray(args[0])) until$ = Dispose.until(args[0]);

    return { onDispose, until$ };
  },
} as const;
