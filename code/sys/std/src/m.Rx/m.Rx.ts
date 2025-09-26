import { type t, Dispose } from './common.ts';
import { Is } from './m.Rx.Is.ts';
import { withinTimeThreshold } from './u.time.ts';

import * as lib from './u.Rx.libs.ts';

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
 * Tools for working with Observables (via the RXJS library).
 */
export const Rx: t.RxLib = {
  ...lib,
  Is,
  noop$: new lib.Subject(),
  withinTimeThreshold,

  done,
  abortable,
  disposable,
  disposableAsync,
  lifecycle,
  lifecycleAsync,
  toLifecycle,

  subject<T>() {
    return new lib.Subject<T>();
  },
};
