import type { t } from './common.ts';

import { done } from './u.done.ts';
import { lifecycle, lifecycleAsync, toLifecycle } from './u.lifecycle.ts';
import { omitDispose } from './u.omitDispose.ts';
import { until } from './u.until.ts';
import { abortable } from './u.abortable.ts';

/**
 * Observable lifecycle helpers with ECMAScript protocol cleanup.
 *
 * Created owners route explicit and protocol requests through one disposal operation and expose it via
 * `dispose$`; projections may intentionally withhold disposal authority.
 */
export const Dispose: t.Dispose.Lib = Object.freeze({
  done,
  until,

  abortable,
  lifecycle,
  lifecycleAsync,
  toLifecycle,

  omitDispose,
});
