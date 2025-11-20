import { type t, Dispose, Immutable, Rx } from './common.ts';

type O = Record<string, unknown>;
export type RefEvents<T extends O> =
  | { type: 'change'; payload: t.CrdtChange<T> }
  | { type: 'deleted'; payload: t.CrdtDeleted };

/**
 * Create a new event-emitter.
 */
export function eventsFactory<T extends O>(
  all$: t.Observable<RefEvents<T>>,
  until?: t.UntilInput,
): t.CrdtEvents<T> {
  const life = Rx.lifecycle(until);

  const life$ = all$.pipe(Rx.takeUntil(life.dispose$));
  const $ = life$.pipe(
    Rx.filter((e) => e.type === 'change'),
    Rx.map((e) => e.payload),
  );
  const deleted$ = life$.pipe(
    Rx.filter((e) => e.type === 'deleted'),
    Rx.map((e) => e.payload),
  );

  const path = Immutable.Events.pathFilter<T, t.CrdtPatch, t.CrdtChange<T>>($, (p) => p.path);

  return Dispose.toLifecycle<t.CrdtEvents<T>>(life, { $, deleted$, path });
}
