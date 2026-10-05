import { Time } from '@sys/std/time';

/** The serve proof owns fetch and every response body; Time owns only the observation window. */
export async function pollManifest(
  url: string,
  timeout: number,
  request: typeof fetch = fetch,
): Promise<Uint8Array> {
  const ctrl = new AbortController();
  try {
    const bytes = await Time.waitFor(async () => {
      let response: Response | undefined;
      try {
        response = await request(url, { redirect: 'manual', signal: ctrl.signal });
        if (ctrl.signal.aborted || response.status !== 200) return undefined;
        return new Uint8Array(await response.arrayBuffer());
      } catch {
        return undefined;
      } finally {
        // Also covers responses delivered after the waiter has already timed out.
        try {
          await response?.body?.cancel();
        } catch { /* A consumed, locked, or errored body may already be unavailable. */ }
      }
    }, { interval: 25, timeout });
    if (!bytes) throw new Error('Local Dist serve did not return its manifest.');
    return bytes;
  } finally {
    // This caller owns request cancellation; rejecting Time.waitFor alone would not abort fetch.
    ctrl.abort();
  }
}
