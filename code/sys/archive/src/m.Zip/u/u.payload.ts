import { crc32, createInflateRaw } from 'node:zlib';
import { Is, Num, type t } from '../common.ts';
import type { InflaterWriter, OperationContext, ParsedEntry, PayloadPass } from './t.ts';
import { failure, isFailure } from './u.failure.ts';

const NativeError = Error;
const NativeUint8Array = Uint8Array;
const typedArrayPrototype = Object.getPrototypeOf(NativeUint8Array.prototype);
const getBuffer = Object.getOwnPropertyDescriptor(typedArrayPrototype, 'buffer')!.get!;
const getOffset = Object.getOwnPropertyDescriptor(typedArrayPrototype, 'byteOffset')!.get!;
const getLength = Object.getOwnPropertyDescriptor(typedArrayPrototype, 'byteLength')!.get!;
const set = Uint8Array.prototype.set;
const YIELD_BYTES = 1024 * 1024;
export const INFLATE_BLOCK_BYTES = 64 * 1024;
export const INFLATE_READABLE_HIGH_WATER_BYTES = 1;
const BLOCK_BYTES = INFLATE_BLOCK_BYTES;

/** Verify every file through the same pull-driven payload owner used by extraction. */
export async function testPayloads(
  bytes: Uint8Array,
  entries: readonly ParsedEntry[],
  context: OperationContext,
  inflate: () => ReturnType<typeof createInflateRaw> = createInflater,
): Promise<t.Zip.TestResult> {
  const pass = payloadPass(bytes, context, inflate);
  let filesTested = 0;
  let compressedBytes = 0;
  let expandedBytes = 0;
  for (const entry of entries) {
    if (entry.metadata.kind === 'directory') continue;
    context.checkpoint(entry.metadata.index);
    compressedBytes = checkedAdd(
      compressedBytes,
      entry.metadata.compressedBytes,
      context,
      entry.metadata.index,
    );
    for await (const block of pass.read(entry, context)) {
      expandedBytes = checkedAdd(
        expandedBytes,
        getLength.call(block),
        context,
        entry.metadata.index,
      );
    }
    filesTested++;
  }
  context.checkpoint();
  return Object.freeze({ kind: 'passed', filesTested, compressedBytes, expandedBytes });
}

/** Counters span a complete pass; creating a reader starts no payload or native work. */
export function payloadPass(
  bytes: Uint8Array,
  context: OperationContext,
  inflate: () => ReturnType<typeof createInflateRaw> = createInflater,
): PayloadPass {
  const meter = new PayloadMeter(context);
  const aggregate = { expanded: 0 };
  return {
    read(entry, sourceContext) {
      return entry.metadata.compression === 'stored'
        ? readStored(bytes, entry, sourceContext, meter, aggregate)
        : readDeflated(bytes, entry, sourceContext, meter, aggregate, inflate);
    },
  };
}

async function* readStored(
  bytes: Uint8Array,
  entry: ParsedEntry,
  context: OperationContext,
  meter: PayloadMeter,
  aggregate: { expanded: number },
): AsyncGenerator<Uint8Array> {
  const metadata = entry.metadata;
  let actual = 0;
  let checksum = 0;
  const end = entry.dataOffset + metadata.compressedBytes;
  // ZIP byte ranges require positional consumption in fixed native quanta.
  for (let offset = entry.dataOffset; offset < end; offset += BLOCK_BYTES) {
    context.checkpoint(metadata.index);
    const block = blockView(bytes, offset, Math.min(end, offset + BLOCK_BYTES));
    const length = getLength.call(block) as number;
    await meter.input(length, metadata.index);
    context.checkpoint(metadata.index);
    checksum = crc32(block, checksum) >>> 0;
    context.checkpoint(metadata.index);
    actual = checkedAdd(actual, length, context, metadata.index);
    aggregate.expanded = checkedAdd(aggregate.expanded, length, context, metadata.index);
    enforceExpansion(actual, aggregate.expanded, metadata, context);
    await meter.output(length, metadata.index);
    context.checkpoint(metadata.index);
    yield copyBlock(block);
  }
  context.checkpoint(metadata.index);
  verifyEvidence(actual, checksum, metadata, context);
}

async function* readDeflated(
  bytes: Uint8Array,
  entry: ParsedEntry,
  context: OperationContext,
  meter: PayloadMeter,
  aggregate: { expanded: number },
  inflate: () => ReturnType<typeof createInflateRaw>,
): AsyncGenerator<Uint8Array> {
  const metadata = entry.metadata;
  context.checkpoint(metadata.index);
  const inflater = inflate();
  const closed = new Promise<void>((resolve) => inflater.once('close', resolve));
  const abort = () => inflater.destroy(new NativeError('ZIP operation stopped'));
  context.signal.addEventListener('abort', abort, { once: true });
  let feedFailure: { cause: unknown } | undefined;
  // Feed concurrently with pull consumption, admitting exactly one native write at a time.
  const feed = (async () => {
    try {
      const end = entry.dataOffset + metadata.compressedBytes;
      for (let offset = entry.dataOffset; offset < end; offset += BLOCK_BYTES) {
        context.checkpoint(metadata.index);
        const block = blockView(bytes, offset, Math.min(end, offset + BLOCK_BYTES));
        await meter.input(getLength.call(block), metadata.index);
        context.checkpoint(metadata.index);
        await writeInflater(inflater, block);
        context.checkpoint(metadata.index);
      }
      inflater.end();
    } catch (cause) {
      feedFailure = { cause };
      if (!inflater.destroyed) inflater.destroy();
    }
  })();
  let actual = 0;
  let checksum = 0;
  try {
    for await (const value of inflater) {
      context.checkpoint(metadata.index);
      if (!Is.Native.uint8Array(value)) throw new TypeError('Inflater emitted non-bytes');
      const output = value as Uint8Array;
      // Native iterator chunks may be coalesced; each exposed/CRC segment remains bounded.
      const outputLength = getLength.call(output) as number;
      for (let offset = 0; offset < outputLength; offset += BLOCK_BYTES) {
        const block = blockView(output, offset, Math.min(outputLength, offset + BLOCK_BYTES));
        const length = getLength.call(block) as number;
        context.checkpoint(metadata.index);
        checksum = crc32(block, checksum) >>> 0;
        context.checkpoint(metadata.index);
        actual = checkedAdd(actual, length, context, metadata.index);
        aggregate.expanded = checkedAdd(aggregate.expanded, length, context, metadata.index);
        enforceExpansion(actual, aggregate.expanded, metadata, context);
        await meter.output(length, metadata.index);
        context.checkpoint(metadata.index);
        yield copyBlock(block);
      }
    }
    await feed;
    context.checkpoint(metadata.index);
    if (feedFailure) throw feedFailure.cause;
    if (
      !Num.Is.safeInt(inflater.bytesWritten) || inflater.bytesWritten !== metadata.compressedBytes
    ) {
      throw new NativeError('ZIP compressed input was not exhausted');
    }
    verifyEvidence(actual, checksum, metadata, context);
  } catch (cause) {
    context.checkpoint(metadata.index);
    const primary = feedFailure?.cause ?? cause;
    if (isFailure(primary)) throw primary;
    throw failure(context.operation, 'deflate-failure', {
      maxErrorChars: context.limits.maxErrorChars,
      entryIndex: metadata.index,
      cause: primary,
    });
  } finally {
    context.signal.removeEventListener('abort', abort);
    if (!inflater.destroyed) inflater.destroy();
    await feed;
    await closed;
  }
}

/** Avoid species/instance-property callbacks while creating archive-private byte views. */
function blockView(bytes: Uint8Array, start: number, end: number): Uint8Array {
  return new NativeUint8Array(getBuffer.call(bytes), getOffset.call(bytes) + start, end - start);
}

/** Fresh ordinary storage is the only payload representation allowed across a sink boundary. */
function copyBlock(block: Uint8Array): Uint8Array {
  const copy = new NativeUint8Array(getLength.call(block));
  set.call(copy, block);
  return copy;
}

/** Create the pinned bounded inflater used by both payload operations. */
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
  if (entryBytes > context.limits.maxEntryBytes || archiveBytes > context.limits.maxExpandedBytes) {
    throw failure(context.operation, 'expanded-limit', {
      maxErrorChars: context.limits.maxErrorChars,
      entryIndex: metadata.index,
    });
  }
  if (entryBytes > metadata.expandedBytes) {
    throw failure(context.operation, 'size-mismatch', {
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
    throw failure(context.operation, 'size-mismatch', {
      maxErrorChars: context.limits.maxErrorChars,
      entryIndex: metadata.index,
    });
  }
  if (checksum !== metadata.crc32) {
    throw failure(context.operation, 'crc-mismatch', {
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
    throw failure(context.operation, 'expanded-limit', {
      maxErrorChars: context.limits.maxErrorChars,
      entryIndex,
    });
  }
  return value;
}

/** Accumulate both sides of one pass without resetting the budget between small files. */
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
