import { type t, rx } from './common.ts';

const NETWORK_TYPES: t.NetworkChangeEvent['type'][] = [
  'network-close',
  'peer-offline',
  'peer-online',
];

export function eventsFactory($: t.Observable<t.CrdtRepoEvent>, life: t.Lifecycle) {
  $ = $.pipe(rx.takeUntil(life.dispose$));

  const isNetwork = (e: t.CrdtRepoEvent): e is t.NetworkChangeEvent => {
    return NETWORK_TYPES.includes(e.type as any);
  };

  const change$ = $.pipe(
    rx.filter((e) => e.type === 'prop-change'),
    rx.map((e) => e.payload),
  );

  return rx.toLifecycle<t.CrdtRepoEvents>(life, {
    $,
    prop$: change$,
    network$: $.pipe(rx.filter(isNetwork)),
  });
}
