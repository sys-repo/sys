import { type t } from './common.ts';
import { toLifecycle, lifecycle } from './u.lifecycle.ts';

export function abortable(until?: t.UntilInput): t.Abortable {
  const life = lifecycle(until);
  const controller = new AbortController();
  const { signal } = controller;

  // Bridge lifecycle → AbortController.
  life.dispose$.subscribe((e) => controller.abort(e?.reason));

  return toLifecycle<t.Abortable>(life, { controller, signal });
}
