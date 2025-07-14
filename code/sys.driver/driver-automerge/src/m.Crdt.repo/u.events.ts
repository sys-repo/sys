import { type t, rx } from './common.ts';

export function eventsFactory($: t.Observable<t.CrdtRepoEvent>, life: t.Lifecycle) {
  $ = $.pipe(rx.takeUntil(life.dispose$));

  const change$ = $.pipe(
    rx.filter((e) => e.type === 'repo-change'),
    rx.map((e) => e.payload),
  );
  const network$ = $.pipe(
    rx.filter((e) => e.type === 'network-change'),
    rx.map((e) => e.payload),
  );

  return rx.toLifecycle<t.CrdtRepoEvents>(life, {
    $,
    change$,
    network$,
  });
}
