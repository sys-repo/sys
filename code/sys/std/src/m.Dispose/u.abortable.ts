import type { t } from './common.ts';
import { abortController, createAbortOwner, isAbortSignalAborted } from './u.async.ts';
import { lifecycle, toLifecycle } from './u.lifecycle.ts';

export function abortable(until?: t.UntilInput): t.Abortable {
  const life = lifecycle(until);
  const { controller, signal } = createAbortOwner();

  life.dispose$.subscribe((e) => {
    if (!isAbortSignalAborted(signal)) abortController(controller, e.reason);
  });

  return toLifecycle<t.Abortable>(life, {
    controller,
    signal,
  });
}
