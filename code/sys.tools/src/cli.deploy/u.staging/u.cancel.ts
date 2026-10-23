/** Fail one staging checkpoint with stable cancellation context. */
export function throwIfStagingCancelled(signal?: AbortSignal): void {
  if (!signal?.aborted) return;
  throw new Error('Deploy staging operation was cancelled.', { cause: signal.reason });
}
