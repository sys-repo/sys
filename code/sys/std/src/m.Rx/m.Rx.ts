import { Dispose, type t } from './common.ts';
import { Is } from './m.Rx.Is.ts';
import { withinTimeThreshold } from './u.time.ts';

import * as lib from './u.Rx.libs.ts';

const { abortable, lifecycle, lifecycleAsync, done, toLifecycle } = Dispose;

/**
 * Tools for working with Observables (via the RXJS library).
 */
export const Rx: t.Rx.Lib = {
  ...lib,
  Is,
  noop$: new lib.Subject(),
  withinTimeThreshold,

  done,
  abortable,
  lifecycle,
  lifecycleAsync,
  toLifecycle,

  subject<T>() {
    return new lib.Subject<T>();
  },
  behaviorSubject<T>(initial: T) {
    return new lib.BehaviorSubject<T>(initial);
  },
};
