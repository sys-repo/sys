import { type t, Dispose } from './common.ts';
import * as lib from './u.Rx.libs.ts';

import { Is } from './m.Is.ts';
import { bus } from './u.bus.ts';
import { event, payload } from './u.payload.ts';
import { asPromise } from './u.promise.ts';
import { withinTimeThreshold } from './u.time.ts';

const {
  //
  disposable,
  abortable,
  disposableAsync,
  lifecycle,
  lifecycleAsync,
  done,
  toLifecycle,
} = Dispose;

/**
 * Preserve generics for event/payload so they match RxLib precisely.
 */
const eventTyped: t.RxLib['event'] = <E extends t.Event>(
  $: t.Observable<unknown>,
  type: E['type'],
) => event<E>($, type);

const payloadTyped: t.RxLib['payload'] = <E extends t.Event>(
  $: t.Observable<unknown>,
  type: E['type'],
) => payload<E>($, type);

/** Tools for working with Observables (via the RXJS library). */
export const Rx: t.RxLib = {
  ...lib,
  Is,
  noop$: new lib.Subject(),
  asPromise,
  withinTimeThreshold,

  bus,
  done,
  abortable,
  disposable,
  disposableAsync,
  lifecycle,
  lifecycleAsync,
  toLifecycle,

  event: eventTyped,
  payload: payloadTyped,

  subject<T>() {
    return new lib.Subject<T>();
  },
};

/** Tools for working with Observables (via the RXJS library). */
export const rx = Rx;
