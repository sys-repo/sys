import type { Subject as RxSubject } from 'rxjs';

import { type t, Rx, slug } from '../common.ts';
import { connect } from './u.bus.connect.ts';
import { busAsType, instance, isBus } from './u.bus.util.ts';
import { event, payload } from './u.payload.ts';
import { asPromise } from './u.promise.ts';

type E = t.Event;

/**
 * Preserve generics for event/payload so they match RxLib precisely.
 */
const eventTyped: t.RxBus['event'] = <E extends t.Event>(
  $: t.Observable<unknown>,
  type: E['type'],
) => event<E>($, type);

const payloadTyped: t.RxBus['payload'] = <E extends t.Event>(
  $: t.Observable<unknown>,
  type: E['type'],
) => payload<E>($, type);

/**
 * Factory for creating an event-bus.
 */
export const factory: t.RxBusFactory = <T extends E = E>(
  input?: t.Subject<any> | t.EventBus<any>,
) => {
  if (isBus(input)) return input as t.EventBus<T>;
  const subject$ = (input as RxSubject<any>) || Rx.subject<any>();
  const res: t.EventBus<T> = {
    // Use a type predicate so the observable is narrowed to T.
    $: subject$.pipe(Rx.filter((e: unknown): e is T => Rx.Is.event(e))),
    fire: (e) => subject$.next(e),
  };
  (res as any)._instance = `bus.${slug()}`; // NB: An instance ID for debugging sanity.
  return res;
};

/**
 * Export extended [bus] function.
 */
const f = factory as any;
f.isObservable = Rx.Is.observable;
f.isBus = isBus;
f.asType = busAsType;
f.instance = instance;
f.connect = connect;

f.event = eventTyped;
f.payload = payloadTyped;
f.asPromise = asPromise;
