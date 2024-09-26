import type { t } from '../common.ts';
import * as lib from './u.Rx.libs.ts';

import { Is } from './u.Rx.Is.ts';
import { disposable, done, lifecycle } from './u.Rx.lifecycle.ts';
import { event, payload } from './u.Rx.payload.ts';
import { asPromise } from './u.Rx.promise.ts';

/**
 * Tools for working with Observables (via the [rxjs] library).
 */
export const rx: t.RxLib = {
  ...lib,
  Is,
  noop$: new lib.Subject(),
  asPromise,

  done,
  lifecycle,
  disposable,

  event,
  payload,
  subject<T>() {
    return new lib.Subject<T>();
  },
};

export const Rx = rx;
