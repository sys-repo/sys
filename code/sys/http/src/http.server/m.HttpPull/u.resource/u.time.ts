import { Schedule, type t, Time } from '../common.ts';

export type Deadline = {
  readonly expired: () => boolean;
  readonly cancel: () => void;
};

const MAX_TIMER_MSECS = 2_147_483_647;

/** Own one monotonic deadline without exceeding the platform timer range. */
export function createDeadline(start: number, duration: number, expire: () => void): Deadline {
  let timer: ReturnType<typeof Time.delay> | undefined;
  let cancelled = false;
  let didExpire = false;

  const elapsed = () => performance.now() - start;
  const remaining = () => Math.max(0, duration - elapsed());
  const schedule = () => {
    if (cancelled || didExpire) return;
    const wait = remaining();
    if (wait <= 0) {
      didExpire = true;
      expire();
      return;
    }
    timer = Time.delay(Math.max(1, Math.min(MAX_TIMER_MSECS, Math.ceil(wait))), schedule);
  };
  schedule();

  return {
    expired: () => {
      if (!cancelled && !didExpire && remaining() <= 0) {
        didExpire = true;
        timer?.cancel();
        expire();
      }
      return didExpire;
    },
    cancel: () => {
      cancelled = true;
      timer?.cancel();
    },
  };
}

/** Wait within one retry window; zero-delay retries still yield a microtask. */
export async function waitForRetry(
  delay: number,
  retryStartedAt: number,
  maxRetryElapsed: number,
  signal: AbortSignal,
): Promise<boolean> {
  if (delay === 0) {
    await Schedule.micro();
    return !signal.aborted && performance.now() - retryStartedAt < maxRetryElapsed;
  }

  const delayStartedAt = performance.now();
  while (!signal.aborted) {
    const retryRemaining = maxRetryElapsed - (performance.now() - retryStartedAt);
    const delayRemaining = delay - (performance.now() - delayStartedAt);
    if (retryRemaining <= 0) return false;
    if (delayRemaining <= 0) return true;
    const wait = Math.max(
      1,
      Math.ceil(Math.min(MAX_TIMER_MSECS, retryRemaining, delayRemaining)),
    );
    await Time.wait(wait as t.Msecs, { signal });
  }
  return false;
}
