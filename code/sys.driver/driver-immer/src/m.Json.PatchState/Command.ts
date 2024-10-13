import { R, rx, type t } from './common.ts';

type Cmd = { type: string; payload: { tx: string } };

export const Command: t.PatchStateCommandLib = {
  dispatcher<T extends Cmd>(
    state?: t.PatchState<{ cmd?: T }, any>,
    options: { debounce?: t.Msecs } = {},
  ) {
    const { debounce = 0 } = options;
    const dispatched$ = rx.subject();
    const reset = () => state?.change((d) => (d.cmd = undefined));
    let _tx = '';

    dispatched$
      .pipe(
        rx.debounceTime(debounce),
        rx.filter(() => state?.current.cmd?.payload.tx === _tx),
      )
      .subscribe(reset);

    function dispatch(cmd: T) {
      _tx = cmd.payload.tx;
      state?.change((d) => (d.cmd = cmd));
      dispatched$.next();
    }

    return dispatch;
  },

  /**
   * Filter down on the "cmd" property observable.
   */
  filter<T extends Cmd>($: t.Observable<t.PatchChange<{ cmd?: T }>>, dispose$?: t.UntilObservable) {
    const res$ = $.pipe(
      rx.distinctWhile((prev, next) => R.equals(prev.after.cmd, next.after.cmd)),
      rx.filter((e) => Boolean(e.after.cmd)),
      rx.map((e) => e.after.cmd!),
    );
    return dispose$ ? res$.pipe(rx.takeUntil(dispose$)) : res$;
  },
} as const;
