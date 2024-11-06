import { filter, map, type t } from './common.ts';
import { Is } from './m.Is.ts';

type Event = { type: string; payload: unknown };

/**
 * Filters on the given event.
 */
export function event<E extends Event>($: t.Observable<unknown>, type: E['type']) {
  return $.pipe(
    filter((e) => Is.event(e)),
    filter((e: any) => e.type === type),
    map((e: any) => e as E),
  );
}

/**
 * Filters on the given event returning the payload.
 */
export function payload<E extends Event>($: t.Observable<unknown>, type: E['type']) {
  return $.pipe(
    filter((e) => Is.event(e)),
    filter((e: any) => e.type === type),
    map((e: any) => e.payload as E['payload']),
  );
}
