import { type t, Rx, slug } from '../common.ts';
import { connect } from './u.bus.connect.ts';
import { busAsType, instance, isBus } from './u.bus.util.ts';
import { event, payload } from './u.payload.ts';
import { asPromise } from './u.promise.ts';

type E = t.Event;

/**
 * Factory for creating an event-bus.
 */
export const factory: t.RxBusFactory = <T extends E = E>(
  input?: t.Subject<any> | t.EventBus<any>,
) => {
  if (isBus(input)) return input as t.EventBus<T>;
  const subject$ = (input as t.Subject<any>) || Rx.subject<any>();
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

f.asPromise = asPromise;
f.event = event;
f.payload = payload;
