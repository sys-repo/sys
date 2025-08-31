import { type t, rx } from './common.ts';

/**
 * Factory:
 */
export function eventsFactory($: t.Observable<t.CrdtRepoEvent>, life: t.Lifecycle) {
  $ = $.pipe(rx.takeUntil(life.dispose$));

  const prop$ = $.pipe(
    rx.filter((e) => e.type === 'prop-change'),
    rx.map((e) => e.payload),
  );

  const ready$ = prop$.pipe(
    rx.filter((change) => change.prop === 'ready'),
    rx.map((change) => change.after.ready === true),
    rx.take(1),
  );

  return rx.toLifecycle<t.CrdtRepoEvents>(life, {
    $,
    ready$,
    prop$,
    network$: $.pipe(rx.filter(EventIs.network)),
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
