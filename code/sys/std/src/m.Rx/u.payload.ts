import { filter, map, type t } from './common.ts';
import { Is } from './m.Is.ts';

type Event = { type: string; payload: unknown };

/**
 * Filters on the given event.
 */
export function event<E extends Event>($: t.Observable<unknown>, type: E['type']): t.Observable<E> {
  return $.pipe(filter((e: unknown): e is E => Is.event(e) && (e as any).type === type));
}

/**
 * Filters on the given event returning the payload.
 */
export function payload<E extends Event>(
  $: t.Observable<unknown>,
  type: E['type'],
): t.Observable<E['payload']> {
  return event<E>($, type).pipe(map((e) => e.payload as E['payload']));
}
