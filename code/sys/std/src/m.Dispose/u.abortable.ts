import type { t } from './common.ts';
import { lifecycle, toLifecycle } from './u.lifecycle.ts';

export function abortable(until?: t.UntilInput): t.Abortable {
  const life = lifecycle(until);
  const controller = new AbortController();
  const { signal } = controller;

  life.dispose$.subscribe((e) => {
    if (!controller.signal.aborted) controller.abort(e.reason);
  });

  return toLifecycle<t.Abortable>(life, {
    controller,
    signal,
  });
}
