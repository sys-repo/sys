import { Num, type t, Time } from '../common.ts';

export type OperationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: unknown };

type DeadlineResult<T> =
  | { readonly kind: 'settled'; readonly value: T }
  | { readonly kind: 'timeout' };

export type OperationDeadline = {
  remaining(limit: t.Msecs): t.Msecs;
};

/**
 * Capture synchronous and asynchronous operation failure as one result promise.
 * Unlike `Try.run`, this preserves raw thrown/rejected identity for causal ledger coalescing.
 */
export function captureOperation<T>(fn: () => Promise<T>): Promise<OperationResult<T>> {
  try {
    return fn().then(
      (value): OperationResult<T> => ({ ok: true, value }),
      (error): OperationResult<T> => ({ ok: false, error }),
    );
  } catch (error) {
    return Promise.resolve({ ok: false, error });
  }
}

/** Wait for one operation no longer than the supplied phase deadline. */
export async function withinDeadline<T>(
  promise: Promise<T>,
  timeout: t.Msecs,
): Promise<DeadlineResult<T>> {
  if (!Num.Is.safeInt(timeout) || timeout < 0 || timeout > Time.Delay.MAX) {
    throw new Error(`Process: invalid timer deadline: ${String(timeout)}.`);
  }

  const deadline = Time.delay(timeout);
  try {
    return await Promise.race([
      promise.then((value): DeadlineResult<T> => ({ kind: 'settled', value })),
      deadline.then((): DeadlineResult<T> => ({ kind: 'timeout' })),
    ]);
  } finally {
    deadline.cancel();
  }
}

/** Share one aggregate budget across sequential owned-resource cleanup phases. */
export function operationDeadline(
  timeout: t.Msecs,
  now: () => number = () => performance.now(),
): OperationDeadline {
  const startedAt = now();
  return {
    remaining(limit) {
      const elapsed = now() - startedAt;
      const remaining = Num.clamp(0, limit, timeout - elapsed);
      return remaining <= 0 ? 0 : Math.ceil(remaining);
    },
  };
}
