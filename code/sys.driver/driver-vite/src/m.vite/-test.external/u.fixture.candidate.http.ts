import { Time } from '../../-test.ts';
import { FIXTURE_CAPTURE } from './u.fixture.run.ts';

const REQUEST_TIMEOUT = 10_000;

// Each build/dev child retains the existing hard process deadline. Cold startup may use
// its budget minus room for a steady-state request and cleanup; it is not an HTTP latency SLA.
export const CANDIDATE_TIMEOUT = {
  startup: FIXTURE_CAPTURE.executionTimeout - 2 * REQUEST_TIMEOUT,
  request: REQUEST_TIMEOUT,
} as const;

/** One attempt; the same deadline covers headers and the entire body. */
export async function requestCandidate(
  base: string,
  path: string,
  timeout: number = CANDIDATE_TIMEOUT.request,
) {
  const url = new URL(path, base);
  const started = performance.now();
  const controller = new AbortController();
  const expired = new DOMException('Candidate HTTP deadline exceeded', 'TimeoutError');
  const timer = Time.delay(timeout, () => controller.abort(expired));
  let stage = 'awaiting headers';
  try {
    if (timeout <= 0) throw expired;
    const response = await fetch(url, { signal: controller.signal });
    stage = `reading body (HTTP ${response.status})`;
    const text = await response.text();
    // A busy compiler can delay timer callbacks; late completion is not a passing deadline.
    if (performance.now() - started >= timeout) throw expired;
    controller.signal.throwIfAborted();
    return {
      status: response.status,
      contentType: response.headers.get('content-type') ?? '',
      text,
    } as const;
  } catch (cause) {
    const elapsed = (performance.now() - started).toFixed(0);
    throw new Error(
      `Candidate HTTP request failed: ${url.href} ${stage} after ${elapsed}ms (deadline ${timeout}ms)`,
      { cause },
    );
  } finally {
    timer.cancel();
  }
}
