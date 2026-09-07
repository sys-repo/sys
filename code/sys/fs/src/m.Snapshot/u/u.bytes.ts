import { Num, ServerIs, type t } from '../common.ts';
import { failure, hostFailure } from './u.failure.ts';

const NativeArrayBuffer = ArrayBuffer;
const NativeUint8Array = Uint8Array;
const getPrototypeOf = Object.getPrototypeOf;
const typedArrayPrototype = getPrototypeOf(NativeUint8Array.prototype);
const getTypedArrayBuffer = Object.getOwnPropertyDescriptor(typedArrayPrototype, 'buffer')!.get!;
const getTypedArrayByteLength = Object.getOwnPropertyDescriptor(
  typedArrayPrototype,
  'byteLength',
)!.get!;
const getTypedArrayByteOffset = Object.getOwnPropertyDescriptor(
  typedArrayPrototype,
  'byteOffset',
)!.get!;
const getArrayBufferByteLength = Object.getOwnPropertyDescriptor(
  NativeArrayBuffer.prototype,
  'byteLength',
)!.get!;
const getArrayBufferDetached = Object.getOwnPropertyDescriptor(
  NativeArrayBuffer.prototype,
  'detached',
)?.get;
const getArrayBufferResizable = Object.getOwnPropertyDescriptor(
  NativeArrayBuffer.prototype,
  'resizable',
)?.get;
const setTypedArray = Object.getOwnPropertyDescriptor(typedArrayPrototype, 'set')!.value as (
  this: Uint8Array,
  source: Uint8Array,
  offset?: number,
) => void;
const subarrayTypedArray = Object.getOwnPropertyDescriptor(
  typedArrayPrototype,
  'subarray',
)!.value as (this: Uint8Array, start: number, end: number) => Uint8Array;

const READ_BYTES = 64 * 1024;

/** Read byte length through the captured native accessor. */
export function byteLengthOf(input: Uint8Array): number {
  return getTypedArrayByteLength.call(input) as number;
}

/** Assemble owned bytes from bounded reads, consuming at most one byte beyond the cap. */
export async function readBytes(
  handle: t.SnapshotHandle,
  maxBytes: number,
  context: t.SnapshotContext,
): Promise<Uint8Array> {
  const chunks: Array<{ readonly bytes: Uint8Array; readonly length: number }> = [];
  let total = 0;
  let done = false;

  while (!done) {
    context.checkpoint();
    const capacity = Math.min(READ_BYTES, maxBytes - total + 1);
    const slab = new NativeUint8Array(capacity);
    let used = 0;

    while (used < capacity) {
      context.checkpoint();
      const request = used === 0 ? slab : subarrayTypedArray.call(slab, used, capacity);
      let count: number | null;
      try {
        count = await handle.read(request);
      } catch (cause) {
        context.checkpoint();
        throw hostFailure(cause);
      }
      context.checkpoint();
      if (count === null) {
        done = true;
        break;
      }
      const requestLength = getTypedArrayByteLength.call(request) as number;
      if (!Num.Is.safeInt(count) || count <= 0 || count > requestLength) {
        throw failure('io-failure');
      }
      if (total + count > maxBytes) throw failure('source-limit');

      used += count;
      total += count;
      await context.yield();
    }

    if (used > 0) chunks.push({ bytes: slab, length: used });
  }

  context.checkpoint();
  const bytes = new NativeUint8Array(total);
  context.checkpoint();
  let offset = 0;
  // Index read-order chunks directly rather than invoking an array iterator.
  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index];
    context.checkpoint();
    const source = chunk.length === getTypedArrayByteLength.call(chunk.bytes)
      ? chunk.bytes
      : subarrayTypedArray.call(chunk.bytes, 0, chunk.length);
    setTypedArray.call(bytes, source, offset);
    offset += chunk.length;
    await context.yield();
  }
  assertOwnedBytes(bytes, total);
  return bytes;
}

function assertOwnedBytes(input: Uint8Array, expected: number): void {
  const backing = getTypedArrayBuffer.call(input) as ArrayBufferLike;
  if (
    ServerIs.Native.proxy(input) ||
    !ServerIs.Native.uint8Array(input) ||
    getPrototypeOf(input) !== NativeUint8Array.prototype ||
    getTypedArrayByteLength.call(input) !== expected ||
    getTypedArrayByteOffset.call(input) !== 0 ||
    ServerIs.Native.sharedArrayBuffer(backing) ||
    getPrototypeOf(backing) !== NativeArrayBuffer.prototype ||
    getArrayBufferByteLength.call(backing) !== expected ||
    getArrayBufferDetached?.call(backing) === true ||
    getArrayBufferResizable?.call(backing) === true
  ) {
    throw failure('io-failure');
  }
}
