import type { t } from './common.ts';
import { lifecycle, toLifecycle } from './u.lifecycle.ts';

export function abortable(until?: t.UntilInput): t.Abortable {
  const life = lifecycle(until);
  const controller = new AbortController();
  const { signal } = controller;

  const tryAbortNow = (reason?: unknown) => {
    if (controller.signal.aborted) return;
    controller.abort(reason);
  };

  /**
   * If `until` is already in a terminal state, abort immediately so we can't miss
   * a fast disposal/abort race during setup.
   */
  const u: any = until;
  if (u?.aborted === true) {
    tryAbortNow(u?.reason);
  } else if (u?.disposed === true || u?.isDisposed === true) {
    tryAbortNow('disposed');
  }

  /**
   * Bridge AbortSignal → controller (in addition to lifecycle).
   * This avoids relying on lifecycle's internal handling of AbortSignal semantics.
   */
  if (u && typeof u.addEventListener === 'function' && u?.aborted !== undefined) {
    u.addEventListener(
      'abort',
      () => {
        tryAbortNow(u?.reason);
      },
      { once: true },
    );
  }

  // Bridge lifecycle → AbortController.
  life.dispose$.subscribe((e) => tryAbortNow((e as any)?.reason));

  return toLifecycle<t.Abortable>(life, {
    controller,
    signal,
  });
}
