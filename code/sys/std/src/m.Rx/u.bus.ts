import { slug } from '../m.Id/mod.ts';
import { Is } from './m.Is.ts';
import { connect } from './u.bus.connect.ts';
import { busAsType, instance, isBus } from './u.bus.util.ts';
import { filter, Subject } from './u.Rx.libs.ts';

import type { t } from '../common.ts';

type E = t.Event;

/**
 * Factory for creating an event-bus.
 */
const factory: t.RxBusFactory = <T extends E = E>(input?: t.Subject<any> | t.EventBus<any>) => {
  if (isBus(input)) return input as t.EventBus<T>;
  const subject$ = (input as Subject<any>) || new Subject<any>();
  const res: t.EventBus<T> = {
    $: subject$.pipe(filter((e) => Is.event(e))),
    fire: (e) => subject$.next(e),
  };
  (res as any)._instance = `bus.${slug()}`; // NB: An instance ID for debugging sanity.
  return res;
};

/**
 * Export extended [bus] function.
 */
const f = factory as any;
f.isObservable = Is.observable;
f.isBus = isBus;
f.asType = busAsType;
f.instance = instance;
f.connect = connect;

export const bus = factory as t.RxBus;
