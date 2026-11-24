import { Is } from '../common.ts';
import type { HttpOperation } from './t.ts';

type ReadBytesArgs = {
  readonly body: ReadableStream<Uint8Array> | null;
  readonly operation: Pick<
    HttpOperation<unknown>,
    'throwIfStopped' | 'race' | 'cancelReader' | 'cancelBody'
  >;
  readonly maxBytes: number;
  readonly overflow: (observed: number) => never;
  readonly onChunk?: (loaded: number) => void;
  readonly onComplete?: (loaded: number) => void;
};

type ByteChunks = {
  readonly chunks: readonly Uint8Array[];
  readonly loaded: number;
};

/** Read bounded bytes, leaving decoding, progress, and failure policy with the owner. */
export async function readBytes(args: ReadBytesArgs): Promise<Uint8Array<ArrayBuffer>> {
  const { body, operation, maxBytes } = args;
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  try {
    operation.throwIfStopped();
    reader = body?.getReader();
    while (reader) {
      const { done, value: chunk } = await operation.race(reader.read());
      operation.throwIfStopped();
      if (done) break;
      if (!Is.uint8Array(chunk)) throw new Error('Expected a byte stream.');
      if (chunk.byteLength > maxBytes - loaded) args.overflow(loaded + chunk.byteLength);
      if (chunk.byteLength === 0) continue;
      loaded += chunk.byteLength;
      chunks.push(chunk.slice());
      args.onChunk?.(loaded);
    }
    // EOF admission and notification share a continuation; callbacks may latch a failure.
    args.onComplete?.(loaded);
    operation.throwIfStopped();
    return concatChunks({ chunks, loaded });
  } catch (cause) {
    if (body && reader) void operation.cancelReader(body, reader);
    else if (body) void operation.cancelBody(body);
    throw cause;
  } finally {
    releaseReader(reader);
  }
}

/**
 * Helpers:
 */
function releaseReader(reader: ReadableStreamDefaultReader<Uint8Array> | undefined): void {
  try {
    reader?.releaseLock();
  } catch {
    // An uncooperative pending read may retain its lock after local settlement.
  }
}

function concatChunks({ chunks, loaded }: ByteChunks): Uint8Array<ArrayBuffer> {
  const output = new Uint8Array(new ArrayBuffer(loaded));
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}
