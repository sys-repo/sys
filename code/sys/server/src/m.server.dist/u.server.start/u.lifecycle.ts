import { Schedule, type t } from './common.ts';
import { startError, startupReason } from '../u.server/u.error.ts';

/** Refuse a listener that fails during its first scheduler turn. */
export async function settleListener(started: t.HttpServer.Started): Promise<void> {
  let terminal: { readonly cause?: unknown } | undefined;
  void started.finished.then(
    () => (terminal = {}),
    (cause) => (terminal = { cause }),
  );
  await Schedule.macro();
  if (terminal) throw startError(startupReason(terminal.cause));
}

/** Run every cleanup action while retaining the first failure. */
export function cleanup(actions: readonly (() => void)[]) {
  let failed = false;
  let failure: unknown;
  for (const action of actions) {
    try {
      action();
    } catch (cause) {
      if (failed) continue;
      failed = true;
      failure = cause;
    }
  }
  return failed ? { ok: false, cause: failure } as const : { ok: true } as const;
}
