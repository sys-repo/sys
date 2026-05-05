import { Time } from '../m.Time/mod.ts';
import { Dispose, type t } from './common.ts';
import { filter, Subject, take, takeUntil } from './u.Rx.libs.ts';

/**
 * Listen for an event within a given time threshold.
 * (for use with repeat operations, like double-click).
 */
export function withinTimeThreshold<T>(
  $: t.Observable<T>,
  timeout: t.Msecs,
  options: { until?: t.UntilInput } = {},
): t.TimeThreshold<T> {
  const life = Dispose.lifecycle(options.until);

  const listen = (timeout: number) => {
    type R = { result: boolean; value?: T };
    const startedAt = Date.now();
    const $$ = new Subject<R>();

    const { dispose, dispose$ } = Dispose.disposable(options.until);

    let timer: t.TimeDelayPromise | undefined;
    const cancelTimer = () => {
      try {
        timer?.cancel?.();
      } catch {
        /* no-op */
      }
      timer = undefined;
    };

    const done = (result: boolean, value?: T) => {
      cancelTimer();
      $$.next({ result, value });
      $$.complete();
      dispose();
    };

    $.pipe(takeUntil(dispose$), take(1)).subscribe((e) => {
      const elapsed = Date.now() - startedAt;
      if (elapsed < timeout) done(true, e);
    });

    timer = Time.delay(timeout, () => {
      done(false);
      timeout$.next();
    });

    dispose$.subscribe(() => cancelTimer());
    return $$;
  };

  const timeout$ = new Subject<void>();
  const $$ = new Subject<T>();

  $.pipe(takeUntil(life.dispose$)).subscribe((e) => {
    const listen$ = listen(timeout).pipe(
      takeUntil(life.dispose$),
      filter((e) => !!e.result),
    );
    listen$.subscribe((e) => $$.next(e.value!));
  });

  return Dispose.toLifecycle<t.TimeThreshold<T>>(life, {
    $: $$.pipe(takeUntil(life.dispose$)),
    timeout$: timeout$.pipe(takeUntil(life.dispose$)),
  });
}
