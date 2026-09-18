import { Is, Num, type t } from './common.ts';
import { signedUrl } from './u.input.ts';

type Result = { readonly bytes: Uint8Array } | { readonly status: number };

/** Acquire bytes with an abortable fetch and retain ownership through body cancellation. */
export async function readObject(
  config: t.RouteConfig,
  key: string,
  operation: t.RouteOperation,
): Promise<Result> {
  const href = await config.sign(key);
  operation.check();
  const url = signedUrl(config, key, href);
  const response = await fetch(url, {
    method: 'GET',
    headers: new Headers(),
    signal: operation.signal,
    redirect: 'manual',
    credentials: 'omit',
    referrer: '',
    referrerPolicy: 'no-referrer',
  });

  // A fetch that ignores abort can still return a body. Close it before releasing the slot.
  if (operation.signal.aborted) {
    await cancelBody(response);
    operation.check();
  }
  if (response.status !== 200 || response.redirected || response.headers.has('content-range')) {
    await cancelBody(response);
    operation.check();
    return { status: response.status === 404 ? 404 : 502 };
  }

  const encoding = response.headers.get('content-encoding')?.trim().toLowerCase();
  if (encoding && !['identity', 'gzip', 'deflate', 'br'].includes(encoding)) {
    await cancelBody(response);
    operation.check();
    return { status: 502 };
  }
  const maxBytes = config.limits.maxBytes;
  // Fetch decodes supported compression but may retain the encoded Content-Length.
  // Only an identity length can reject early; the stream is always counted as well.
  const declared = response.headers.get('content-length');
  const size = declared !== null && /^\d+$/.test(declared) ? Number(declared) : undefined;
  const identity = !encoding || encoding === 'identity';
  if (identity && Num.Is.safeInt(size) && size > maxBytes) {
    await cancelBody(response);
    operation.check();
    return { status: 413 };
  }
  return await readBody(response, maxBytes, operation);
}

/** Retain at most maxBytes of chunks; await cancellation before releasing the reader. */
async function readBody(
  response: Response,
  maxBytes: number,
  operation: t.RouteOperation,
): Promise<Result> {
  const body = response.body;
  if (!body) return { bytes: new Uint8Array() };
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let complete = false;
  let cancellation: Promise<void> | undefined;
  const cancel = () => {
    cancellation ??= cancelReader(reader);
    return cancellation;
  };
  const onAbort = () => {
    void cancel();
  };
  operation.signal.addEventListener('abort', onAbort, { once: true });

  try {
    if (operation.signal.aborted) onAbort();
    while (true) {
      operation.check();
      const item = await reader.read();
      operation.check();
      if (item.done) {
        complete = true;
        const bytes = new Uint8Array(total);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.byteLength;
        }
        return { bytes };
      }
      const chunk = item.value;
      if (!Is.uint8Array(chunk)) throw new Error('R2 response contained a non-byte chunk.');
      if (chunk.byteLength === 0) continue;
      if (chunk.byteLength > maxBytes - total) return { status: 413 };
      total += chunk.byteLength;
      chunks.push(chunk.slice());
    }
  } finally {
    if (!complete) await cancel();
    operation.signal.removeEventListener('abort', onAbort);
    reader.releaseLock();
  }
}

async function cancelReader(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
  try {
    await reader.cancel();
  } catch {
    // Cancellation rejection still settles ownership.
  }
}

async function cancelBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // Cancellation rejection still settles ownership.
  }
}
