import { type t, Rx } from './common.ts';

type Event = { type: string; payload: unknown };

/**
 * Filters on the given event.
 */
export function event<E extends Event>($: t.Observable<unknown>, type: E['type']): t.Observable<E> {
  return $.pipe(Rx.filter((e: unknown): e is E => Rx.Is.event(e) && (e as any).type === type));
}

/**
 * Filters on the given event returning the payload.
 */
export function payload<E extends Event>(
  $: t.Observable<unknown>,
  type: E['type'],
): t.Observable<E['payload']> {
  return event<E>($, type).pipe(Rx.map((e) => e.payload as E['payload']));
}
