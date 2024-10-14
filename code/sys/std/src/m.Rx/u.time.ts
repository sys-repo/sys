import { Time } from '../m.DateTime/mod.ts';
import { type t, Dispose } from './common.ts';
import { Subject, filter, take, takeUntil } from './u.Rx.libs.ts';

/**
 * Listen for an event within a given time threshold.
 * (for use with repeat operations, like double-click).
 */
export function withinTimeThreshold<T>(
  $: t.Observable<T>,
  timeout: t.Msecs,
  options: { dispose$?: t.UntilObservable } = {},
): t.TimeThreshold<T> {
  const listen = (timeout: number) => {
    type R = { result: boolean; value?: T };
    const startedAt = Date.now();
    const $$ = new Subject<R>();
    const { dispose, dispose$ } = Dispose.disposable(options.dispose$);
    const done = (result: boolean, value?: T) => {
      $$.next({ result, value });
      $$.complete();
      dispose();
    };

    $.pipe(takeUntil(dispose$), take(1)).subscribe((e) => {
      const elapsed = Date.now() - startedAt;
      if (elapsed < timeout) done(true, e);
    });

    Time.delay(timeout, () => {
      done(false);
      timeout$.next();
    });
    return $$;
  };

  /**
   * Response listener.
   */
  const timeout$ = new Subject<void>();
  const $$ = new Subject<T>();
  $.subscribe((e) => {
    const listen$ = listen(timeout).pipe(
      takeUntil(dispose$),
      filter((e) => !!e.result),
    );
    listen$.subscribe((e) => $$.next(e.value!));
  });

  let _disposed = false;
  const { dispose, dispose$ } = Dispose.disposable(options.dispose$);
  dispose$.subscribe(() => {
    $$.complete();
    _disposed = true;
  });

  return {
    $: $$.pipe(takeUntil(dispose$)),
    timeout$: timeout$.pipe(takeUntil(dispose$)),
    dispose,
    dispose$,
    get disposed() {
      return _disposed;
    },
  };
}
