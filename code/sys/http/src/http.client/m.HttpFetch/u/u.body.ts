import { Is, Num, type t } from '../common.ts';
import type { ValidatedPolicy } from './u.input.ts';
import type { Operation } from './u.operation.ts';

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

/** Read one successful body within byte, time, and progress bounds. */
export async function readBody(args: ReadBodyArgs): Promise<Uint8Array<ArrayBuffer>> {
  const { operation, response, policy, requestedUrl, finalUrl, onProgress } = args;
  const total = contentLength(response.headers);
  if (total !== undefined && total > policy.maxBytes) {
    void operation.cancelResponse(response).catch(() => undefined);
    operation.fail('response-too-large');
  }

  const body = response.body;
  if (!body) {
    emitProgress(operation, onProgress, {
      requestedUrl,
      finalUrl,
      loaded: 0,
      total,
      complete: true,
    });
    return new Uint8Array();
  }

  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  let lastProgress = Number.NEGATIVE_INFINITY;

  try {
    reader = body.getReader();
    while (true) {
      const item = await operation.race(reader.read());
      operation.throwIfStopped();

      if (item.done) {
        emitProgress(operation, onProgress, {
          requestedUrl,
          finalUrl,
          loaded,
          total,
          complete: true,
        });
        return concat(chunks, loaded);
      }

      const chunk = item.value;
      if (!Is.uint8Array(chunk)) throw new Error('Fetch response body produced a non-byte chunk');
      if (chunk.byteLength > policy.maxBytes - loaded) {
        const observed = loaded + chunk.byteLength;
        if (Num.Is.safeInt(observed)) {
          emitProgress(operation, onProgress, {
            requestedUrl,
            finalUrl,
            loaded: observed,
            total,
            complete: false,
          });
        }
        void operation.cancelReader(body, reader);
        operation.fail('response-too-large');
      }

      loaded += chunk.byteLength;
      chunks.push(chunk.slice());

      const now = performance.now();
      if (now - lastProgress >= policy.progressInterval) {
        emitProgress(operation, onProgress, {
          requestedUrl,
          finalUrl,
          loaded,
          total,
          complete: false,
        });
        lastProgress = now;
      }
    }
  } catch (cause: unknown) {
    if (reader) void operation.cancelReader(body, reader);
    else void operation.cancelResponse(response).catch(() => undefined);
    throw cause;
  } finally {
    try {
      reader?.releaseLock();
    } catch {
      // A hostile pending read may retain the lock after deadline settlement.
    }
  }
}

function emitProgress(
  operation: Operation,
  handler: t.HttpFetch.ResponsePolicy.ProgressHandler | undefined,
  event: t.HttpFetch.ResponsePolicy.ProgressEvent,
): void {
  if (!handler) return;

  let output: unknown;
  try {
    output = handler(event);
  } catch {
    operation.fail('progress-failure');
  }

  operation.throwIfStopped();
  let isThenable = false;
  try {
    isThenable = Is.promise(output);
  } catch {
    operation.fail('progress-failure');
  }
  if (isThenable) {
    try {
      Promise.resolve(output).catch(() => undefined);
    } catch {
      // The policy failure below owns callback classification.
    }
    operation.fail('progress-failure');
  }
}

function contentLength(headers: Headers): t.NumberBytes | undefined {
  const input = headers.get('content-length');
  if (!Is.str(input) || !/^\d+$/.test(input)) return;
  const value = Number(input);
  return Num.Is.safeInt(value) ? value : undefined;
}

function concat(chunks: readonly Uint8Array[], length: number): Uint8Array<ArrayBuffer> {
  const output = new Uint8Array(new ArrayBuffer(length));
  let offset = 0;
  chunks.forEach((chunk) => {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  });
  return output;
}
