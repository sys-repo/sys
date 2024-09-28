import type { t } from '../common.ts';

import { Dispose } from '../u.Dispose/mod.ts';
import * as lib from './u.Rx.libs.ts';

import { Is } from './u.Rx.Is.ts';
import { event, payload } from './u.Rx.payload.ts';
import { asPromise } from './u.Rx.promise.ts';

const { disposable, done, lifecycle } = Dispose;

/**
 * Tools for working with Observables (via the [rxjs] library).
 */
export const Rx: t.RxLib = {
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

export const rx = Rx;
