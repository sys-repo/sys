import { Time } from './common.ts';
import type { RouteOperation } from './t.internal.ts';

/** Signal cancellation or timeout; the worker disposes this operation after cleanup. */
export function createOperation(caller: AbortSignal, timeout: number): RouteOperation {
  const controller = new AbortController();
  const deadline = performance.now() + timeout;
  let status: number | undefined;
  let settle: (status: number) => void = () => {};
  const stopped = new Promise<number>((resolve) => {
    settle = resolve;
  });
  const stop = (next: number) => {
    if (status !== undefined) return;
    status = next;
    settle(next);
    controller.abort();
  };
  const onAbort = () => stop(499);
  caller.addEventListener('abort', onAbort, { once: true });
  if (caller.aborted) onAbort();
  const timer = Time.delay(timeout, () => stop(504));

  return {
    signal: controller.signal,
    stopped,
    get status() {
      return status;
    },
    check() {
      if (performance.now() >= deadline) stop(504);
      if (status !== undefined) throw new Error('R2 read route stopped.');
    },
    dispose() {
      timer.cancel();
      caller.removeEventListener('abort', onAbort);
    },
  };
}
