import { crc32, createInflateRaw } from 'node:zlib';
import { Is, Num, type t } from '../common.ts';
import { failure, isFailure } from './u.failure.ts';
import type { OperationContext } from './u.operation.ts';
import type { ParsedEntry } from './u.parse.ts';

export const INFLATE_BLOCK_BYTES = 64 * 1024;
export const INFLATE_READABLE_HIGH_WATER_BYTES = 1;
const BLOCK_BYTES = INFLATE_BLOCK_BYTES;
const YIELD_BYTES = 1024 * 1024;
const NativeError = Error;
const subarray = Uint8Array.prototype.subarray;

/** Verify every regular-file payload in physical order. */
export async function testPayloads(
  bytes: Uint8Array,
  entries: readonly ParsedEntry[],
  context: OperationContext,
  inflate: () => ReturnType<typeof createInflateRaw> = createInflater,
): Promise<t.Zip.TestResult> {
  const meter = new PayloadMeter(context);
  const aggregate = { expanded: 0 };
  let filesTested = 0;
  let compressedBytes = 0;

  for (const entry of entries) {
    if (entry.metadata.kind === 'directory') continue;
    const index = entry.metadata.index;
    context.checkpoint(index);
    compressedBytes = checkedAdd(compressedBytes, entry.metadata.compressedBytes, context, index);
    if (entry.metadata.compression === 'stored') {
      await verifyStored(bytes, entry, context, meter, aggregate);
    } else {
      await verifyDeflated(bytes, entry, context, meter, aggregate, inflate);
    }
    filesTested++;
  }

  context.checkpoint();
  return Object.freeze({
    kind: 'passed',
    filesTested,
    compressedBytes,
    expandedBytes: aggregate.expanded,
  });
}

async function verifyStored(
  bytes: Uint8Array,
  entry: ParsedEntry,
  context: OperationContext,
  meter: PayloadMeter,
  aggregate: { expanded: number },
): Promise<void> {
  const metadata = entry.metadata;
  let actual = 0;
  let checksum = 0;
  const end = entry.dataOffset + metadata.compressedBytes;

  for (let offset = entry.dataOffset; offset < end; offset += BLOCK_BYTES) {
    context.checkpoint(metadata.index);
    const block = subarray.call(bytes, offset, Math.min(end, offset + BLOCK_BYTES));
    const length = block.byteLength;
    await meter.input(length, metadata.index);
    context.checkpoint(metadata.index);
    checksum = crc32(block, checksum) >>> 0;
    context.checkpoint(metadata.index);
    actual = checkedAdd(actual, length, context, metadata.index);
    aggregate.expanded = checkedAdd(aggregate.expanded, length, context, metadata.index);
    enforceExpansion(actual, aggregate.expanded, metadata, context);
    await meter.output(length, metadata.index);
  }

  verifyEvidence(actual, checksum, metadata, context);
}

async function verifyDeflated(
  bytes: Uint8Array,
  entry: ParsedEntry,
  context: OperationContext,
  meter: PayloadMeter,
  aggregate: { expanded: number },
  inflate: () => ReturnType<typeof createInflateRaw>,
): Promise<void> {
  const metadata = entry.metadata;
  const inflater = inflate();
  const closed = new Promise<void>((resolve) => inflater.once('close', resolve));
  const abort = () => inflater.destroy(new NativeError('ZIP operation stopped'));
  context.signal.addEventListener('abort', abort, { once: true });

  let actual = 0;
  let checksum = 0;
  let settled = false;
  let consumeFailure: unknown;
  const consume = (async () => {
    for await (const value of inflater) {
      context.checkpoint(metadata.index);
      if (!Is.Native.uint8Array(value)) throw new TypeError('Inflater emitted non-bytes');
      const output = value as Uint8Array;
      for (let offset = 0; offset < output.byteLength; offset += BLOCK_BYTES) {
        const block = subarray.call(
          output,
          offset,
          Math.min(output.byteLength, offset + BLOCK_BYTES),
        );
        const length = block.byteLength;
        context.checkpoint(metadata.index);
        checksum = crc32(block, checksum) >>> 0;
        context.checkpoint(metadata.index);
        actual = checkedAdd(actual, length, context, metadata.index);
        aggregate.expanded = checkedAdd(aggregate.expanded, length, context, metadata.index);
        enforceExpansion(actual, aggregate.expanded, metadata, context);
        await meter.output(length, metadata.index);
      }
    }
  })()
    .catch((cause) => {
      consumeFailure = cause;
      throw cause;
    })
    .finally(() => void (settled = true));
  void consume.catch(() => undefined);

  try {
    const end = entry.dataOffset + metadata.compressedBytes;
    for (let offset = entry.dataOffset; offset < end; offset += BLOCK_BYTES) {
      context.checkpoint(metadata.index);
      const block = subarray.call(bytes, offset, Math.min(end, offset + BLOCK_BYTES));
      await meter.input(block.byteLength, metadata.index);
      await writeInflater(inflater, block);
      context.checkpoint(metadata.index);
    }
    inflater.end();
    await consume;
    context.checkpoint(metadata.index);
    if (
      !Num.Is.safeInt(inflater.bytesWritten) || inflater.bytesWritten !== metadata.compressedBytes
    ) {
      throw failure('test', 'deflate-failure', {
        maxErrorChars: context.limits.maxErrorChars,
        entryIndex: metadata.index,
      });
    }
    verifyEvidence(actual, checksum, metadata, context);
  } catch (cause) {
    if (!inflater.destroyed) inflater.destroy();
    if (!settled) {
      try {
        await consume;
      } catch (outputCause) {
        consumeFailure ??= outputCause;
      }
    }
    context.checkpoint(metadata.index);
    const primary = consumeFailure ?? cause;
    if (isFailure(primary)) throw primary;
    throw failure('test', 'deflate-failure', {
      maxErrorChars: context.limits.maxErrorChars,
      entryIndex: metadata.index,
      cause: primary,
    });
  } finally {
    context.signal.removeEventListener('abort', abort);
    if (!settled) {
      if (!inflater.destroyed) inflater.destroy();
      try {
        await consume;
      } catch {
        // Settlement is observed; the primary operation result remains authoritative.
      }
    }
    if (!inflater.destroyed) inflater.destroy();
    await closed;
  }
}

export type InflaterWriter = {
  write(bytes: Uint8Array, callback: (error?: Error | null) => void): boolean;
  once(event: string, listener: (cause?: unknown) => void): unknown;
  removeListener(event: string, listener: (cause?: unknown) => void): unknown;
};

/** Create the pinned bounded inflater used by integrity operations. */
export function createInflater(): ReturnType<typeof createInflateRaw> {
  const options = {
    chunkSize: BLOCK_BYTES,
    readableHighWaterMark: INFLATE_READABLE_HIGH_WATER_BYTES,
    writableHighWaterMark: BLOCK_BYTES,
  };
  return createInflateRaw(options);
}

/** Complete one write and, when required, its corresponding backpressure drain. */
export function writeInflater(inflater: InflaterWriter, bytes: Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => {
    let returned = false;
    let callbackDone = false;
    let needsDrain = false;
    let drained = false;
    let settled = false;

    const cleanup = () => {
      inflater.removeListener('drain', onDrain);
      inflater.removeListener('error', onError);
      inflater.removeListener('close', onClose);
    };
    const pass = () => {
      if (settled || !returned || !callbackDone || (needsDrain && !drained)) return;
      settled = true;
      cleanup();
      resolve();
    };
    const stop = (cause: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(cause);
    };
    const onDrain = () => {
      drained = true;
      pass();
    };
    const onError = (cause?: unknown) => stop(cause);
    const onClose = () => stop(new NativeError('ZIP inflater closed before write settlement'));

    inflater.once('drain', onDrain);
    inflater.once('error', onError);
    inflater.once('close', onClose);
    try {
      needsDrain = !inflater.write(bytes, (error?: Error | null) => {
        if (error) stop(error);
        else {
          callbackDone = true;
          pass();
        }
      });
      drained = !needsDrain;
      returned = true;
      pass();
    } catch (cause) {
      stop(cause);
    }
  });
}

function enforceExpansion(
  entryBytes: number,
  archiveBytes: number,
  metadata: t.Zip.Entry,
  context: OperationContext,
): void {
  if (
    entryBytes > context.limits.maxEntryBytes ||
    archiveBytes > context.limits.maxExpandedBytes
  ) {
    throw failure('test', 'expanded-limit', {
      maxErrorChars: context.limits.maxErrorChars,
      entryIndex: metadata.index,
    });
  }
  if (entryBytes > metadata.expandedBytes) {
    throw failure('test', 'size-mismatch', {
      maxErrorChars: context.limits.maxErrorChars,
      entryIndex: metadata.index,
    });
  }
}

function verifyEvidence(
  actual: number,
  checksum: number,
  metadata: t.Zip.Entry,
  context: OperationContext,
): void {
  if (actual !== metadata.expandedBytes) {
    throw failure('test', 'size-mismatch', {
      maxErrorChars: context.limits.maxErrorChars,
      entryIndex: metadata.index,
    });
  }
  if (checksum !== metadata.crc32) {
    throw failure('test', 'crc-mismatch', {
      maxErrorChars: context.limits.maxErrorChars,
      entryIndex: metadata.index,
    });
  }
}

function checkedAdd(
  left: number,
  right: number,
  context: OperationContext,
  entryIndex: number,
): number {
  const value = left + right;
  if (!Num.Is.safeInt(value) || value < 0) {
    throw failure('test', 'expanded-limit', {
      maxErrorChars: context.limits.maxErrorChars,
      entryIndex,
    });
  }
  return value;
}

class PayloadMeter {
  readonly #context: OperationContext;
  #inputBytes = 0;
  #outputBytes = 0;

  constructor(context: OperationContext) {
    this.#context = context;
  }

  async input(bytes: number, entryIndex: number): Promise<void> {
    this.#inputBytes += bytes;
    this.#context.checkpoint(entryIndex);
    if (this.#inputBytes >= YIELD_BYTES) await this.#yield(entryIndex);
  }

  async output(bytes: number, entryIndex: number): Promise<void> {
    this.#outputBytes += bytes;
    this.#context.checkpoint(entryIndex);
    if (this.#outputBytes >= YIELD_BYTES) await this.#yield(entryIndex);
  }

  async #yield(entryIndex: number): Promise<void> {
    this.#inputBytes = 0;
    this.#outputBytes = 0;
    await this.#context.yieldTurn(entryIndex);
  }
}
