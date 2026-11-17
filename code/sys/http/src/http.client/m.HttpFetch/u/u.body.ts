import { readBytes } from '../../../u/u.body.ts';
import { Is, Num, type t } from '../common.ts';
import type { Operation, ValidatedPolicy } from './t.ts';

type ReadBodyArgs = {
  readonly operation: Operation;
  readonly response: Response;
  readonly policy: ValidatedPolicy;
  readonly requestedUrl: t.StringUrl;
  readonly finalUrl: t.StringUrl;
  readonly onProgress?: t.HttpFetch.ResponsePolicy.ProgressHandler;
};

/** Discard an unexpected successful HEAD body. */
export async function discardHeadBody(
  response: Response,
  operation: Operation,
): Promise<Uint8Array<ArrayBuffer>> {
  await operation.cancelResponse(response);
  operation.throwIfStopped();
  return new Uint8Array();
}

/** Read one successful body within Fetch-owned byte, time, and progress policy. */
export function readBody(args: ReadBodyArgs): Promise<Uint8Array<ArrayBuffer>> {
  const { operation, response, policy, requestedUrl, finalUrl, onProgress } = args;
  const total = contentLength(response.headers);
  if (total !== undefined && total > policy.maxBytes) {
    void operation.cancelResponse(response).catch(() => undefined);
    operation.fail('response-too-large');
  }
  let lastProgress = -Num.INFINITY;
  const progress = (loaded: number, complete: boolean) => {
    emitProgress(operation, onProgress, { requestedUrl, finalUrl, loaded, total, complete });
  };
  return readBytes({
    body: response.body,
    operation,
    maxBytes: policy.maxBytes,
    overflow(observed) {
      if (Num.Is.safeInt(observed)) progress(observed, false);
      return operation.fail('response-too-large');
    },
    onChunk(loaded) {
      const now = performance.now();
      if (now - lastProgress >= policy.progressInterval) {
        progress(loaded, false);
        lastProgress = now;
      }
    },
    onComplete: (loaded) => progress(loaded, true),
  });
}

function emitProgress(
  operation: Operation,
  handler: t.HttpFetch.ResponsePolicy.ProgressHandler | undefined,
  event: t.HttpFetch.ResponsePolicy.ProgressEvent,
): void {
  if (!handler) return;
  try {
    const output = handler(event);
    // Latch elapsed time without skipping rejection observation when the callback stopped us.
    operation.checkDeadline();
    if (!Is.promise(output)) {
      operation.throwIfStopped();
      return;
    }
    // Async callbacks are forbidden, but their rejection must still be observed.
    Promise.resolve(output).catch(() => undefined);
  } catch {
    // Callback execution and thenable inspection share one failure policy.
  }
  // fail preserves a cancellation/deadline already latched by the callback or checkpoint.
  operation.fail('progress-failure');
}

function contentLength(headers: Headers): t.NumberBytes | undefined {
  const input = headers.get('content-length');
  if (!Is.str(input) || !/^\d+$/.test(input)) return;
  const value = Number(input);
  return Num.Is.safeInt(value) ? value : undefined;
}
