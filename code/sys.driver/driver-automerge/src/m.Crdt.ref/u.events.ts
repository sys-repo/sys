import { type t, Dispose, Immutable, rx } from './common.ts';
type O = Record<string, unknown>;

/**
 * Create a new event-emitter.
 */
export function eventsFactory<T extends O>(
  doc$: t.Observable<t.CrdtChange<T>>,
  dispose$?: t.UntilInput,
): t.CrdtEvents<T> {
  const life = rx.lifecycle(dispose$);
  const $ = doc$.pipe(rx.takeUntil(life.dispose$));
  const path = Immutable.Events.pathFilter<T, t.CrdtPatch, t.CrdtChange<T>>($, (p) => p.path);
  return Dispose.toLifecycle<t.CrdtEvents<T>>(life, { $, path });
}
