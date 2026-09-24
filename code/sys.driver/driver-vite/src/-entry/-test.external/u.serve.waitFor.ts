import { Time } from '@sys/std/time';

/** Keep request and response-body ownership inside the cached-serve proof's predicate. */
export async function waitForIndex(
  origin: string,
  timeout = 5_000,
  request: typeof fetch = fetch,
): Promise<Uint8Array> {
  const ctrl = new AbortController();
  try {
    const bytes = await Time.waitFor(async () => {
      let response: Response | undefined;
      try {
        response = await request(origin, { redirect: 'manual', signal: ctrl.signal });
        if (ctrl.signal.aborted || response.status !== 200) return undefined;
        return new Uint8Array(await response.arrayBuffer());
      } catch {
        return undefined;
      } finally {
        // False and late results cannot transfer a live response body to the waiter.
        try {
          await response?.body?.cancel();
        } catch { /* A consumed, locked, or errored body may already be unavailable. */ }
      }
    }, { interval: 25, timeout });
    if (!bytes) throw new Error('Timed out waiting for cached-only serve response.');
    return bytes;
  } finally {
    ctrl.abort();
  }
}
