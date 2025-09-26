import { type t, Rx } from './common.ts';

/**
 * Factory:
 */
export function eventsFactory($: t.Observable<t.CrdtRepoEvent>, life: t.Lifecycle) {
  $ = $.pipe(Rx.takeUntil(life.dispose$));

  const prop$ = $.pipe(
    Rx.filter((e) => e.type === 'prop-change'),
    Rx.map((e) => e.payload),
  );

  const ready$ = prop$.pipe(
    Rx.filter((change) => change.prop === 'ready'),
    Rx.map((change) => change.after.ready === true),
    Rx.take(1),
  );

  return Rx.toLifecycle<t.CrdtRepoEvents>(life, {
    $,
    ready$,
    prop$,
    network$: $.pipe(Rx.filter(EventIs.network)),
  });
}

/**
 * Boolean flag helpers for events:
 */
export const EventIs = {
  network(e: t.CrdtRepoEvent): e is t.CrdtNetworkChangeEvent {
    const TYPES: t.CrdtNetworkChangeEvent['type'][] = [
      'network/close',
      'network/peer-offline',
      'network/peer-online',
    ];
    return TYPES.includes(e.type as any);
  },
} as const;
