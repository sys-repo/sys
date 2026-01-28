import { Time } from '../m.Time/mod.ts';
import { type t, Dispose } from './common.ts';
import { Subject, filter, take, takeUntil } from './u.Rx.libs.ts';

/**
 * Listen for an event within a given time threshold.
 * (for use with repeat operations, like double-click).
 */
export function withinTimeThreshold<T>(
  $: t.Observable<T>,
  timeout: t.Msecs,
  options: { dispose$?: t.UntilInput } = {},
): t.TimeThreshold<T> {
  const life = Dispose.lifecycle(options.dispose$);

  const listen = (timeout: number) => {
    type R = { result: boolean; value?: T };
    const startedAt = Date.now();
    const $$ = new Subject<R>();
    const { dispose, dispose$ } = Dispose.disposable(options.dispose$);

    // ----------- added (ensure timer cancellation + single settle) -----------
    let settled = false;
    let timer: t.TimeDelayPromise | undefined;

    const done = (result: boolean, value?: T) => {
      if (settled) return;
      settled = true;
      $$.next({ result, value });
      $$.complete();
      dispose();
    };
    // ----------- /added -----------

    $.pipe(takeUntil(dispose$), take(1)).subscribe((e) => {
      const elapsed = Date.now() - startedAt;
      if (elapsed < timeout) done(true, e);
    });

    // ----------- changed (track + cancel pending timeout) -----------
    timer = Time.delay(timeout, () => {
      done(false);
      timeout$.next();
    });

    dispose$.subscribe(() => timer?.cancel());
    // ----------- /changed -----------

    return $$;
  };

  /**
   * Response listener:
   */
  const timeout$ = new Subject<void>();
  const $$ = new Subject<T>();

  // ----------- changed (dispose outer subscription) -----------
  $.pipe(takeUntil(life.dispose$)).subscribe((e) => {
    const listen$ = listen(timeout).pipe(
      takeUntil(life.dispose$),
      filter((e) => !!e.result),
    );
    listen$.subscribe((e) => $$.next(e.value!));
  });
  // ----------- /changed -----------

  /**
   * API:
   */
  return Dispose.toLifecycle<t.TimeThreshold<T>>(life, {
    $: $$.pipe(takeUntil(life.dispose$)),
    timeout$: timeout$.pipe(takeUntil(life.dispose$)),
  });
}
