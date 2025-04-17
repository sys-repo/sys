import { type t } from './common.ts';

import { disposable, disposableAsync } from './u.dispose.ts';
import { done } from './u.done.ts';
import { lifecycle, lifecycleAsync, toLifecycle } from './u.lifecycle.ts';
import { until } from './u.until.ts';
import { omitDispose } from './u.omitDispose.ts';

/**
 * Toolkit for working with disposable interfaces.
 */
export const Dispose: t.DisposeLib = {
  done,
  until,

  disposable,
  disposableAsync,

  lifecycle,
  lifecycleAsync,
  toLifecycle,

  omitDispose,
};
