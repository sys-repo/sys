import { type t, Dispose } from './common.ts';
import * as lib from './u.Rx.libs.ts';

import { Is } from './m.Is.ts';
import { bus } from './u.bus.ts';
import { event, payload } from './u.payload.ts';
import { asPromise } from './u.promise.ts';
import { withinTimeThreshold } from './u.time.ts';

const { disposable, disposableAsync, lifecycle, lifecycleAsync, done } = Dispose;

/** Tools for working with Observables (via the RXJS library). */
export const Rx: t.RxLib = {
  ...lib,
  Is,
  noop$: new lib.Subject(),
  asPromise,
  withinTimeThreshold,

  bus,
  done,
  disposable,
  lifecycle,
  disposableAsync,
  lifecycleAsync,

  event,
  payload,
  subject<T>() {
    return new lib.Subject<T>();
  },
};

/** Tools for working with Observables (via the RXJS library). */
export const rx = Rx;
