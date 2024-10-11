import type { t } from '../common.ts';

import { Dispose } from '../m.Dispose/mod.ts';
import * as lib from './u.Rx.libs.ts';

import { Is } from './m.Rx.Is.ts';
import { event, payload } from './u.Rx.payload.ts';
import { asPromise } from './u.Rx.promise.ts';

const { disposable, disposableAsync, lifecycle, lifecycleAsync, done } = Dispose;

/* Tools for working with Observables (via the RXJS library). */
export const Rx: t.RxLib = {
  ...lib,
  Is,
  noop$: new lib.Subject(),
  asPromise,

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

/* Tools for working with Observables (via the RXJS library). */
export const rx = Rx;
