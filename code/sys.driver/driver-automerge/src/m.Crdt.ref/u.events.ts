import { type t, Dispose, Immutable, rx } from './common.ts';

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
  const life = rx.lifecycle(until);

  const life$ = all$.pipe(rx.takeUntil(life.dispose$));
  const $ = life$.pipe(
    rx.filter((e) => e.type === 'change'),
    rx.map((e) => e.payload),
  );
  const deleted$ = life$.pipe(
    rx.filter((e) => e.type === 'deleted'),
    rx.map((e) => e.payload),
  );

  const path = Immutable.Events.pathFilter<T, t.CrdtPatch, t.CrdtChange<T>>($, (p) => p.path);

  return Dispose.toLifecycle<t.CrdtEvents<T>>(life, { $, deleted$, path });
}
