import type { DisposeLib } from './t.ts';

import { disposable, disposableAsync } from './u.dispose.ts';
import { done } from './u.done.ts';
import { lifecycle, lifecycleAsync, toLifecycle } from './u.lifecycle.ts';
import { omitDispose } from './u.omitDispose.ts';
import { until } from './u.until.ts';
import { abortable } from './u.abortable.ts';

/**
 * Toolkit for working with disposable interfaces.
 */
export const Dispose: DisposeLib = {
  done,
  until,

  disposable,
  disposableAsync,

  abortable,
  lifecycle,
  lifecycleAsync,
  toLifecycle,

  omitDispose,
};
