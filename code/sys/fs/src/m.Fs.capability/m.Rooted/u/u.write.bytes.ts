import { ServerIs } from '../common.ts';

const NativeUint8Array = Uint8Array;
const arrayPrototype = NativeUint8Array.prototype;
const bufferPrototype = ArrayBuffer.prototype;
const prototypeOf = Object.getPrototypeOf;
const descriptorOf = Object.getOwnPropertyDescriptor;
const typedPrototype = prototypeOf(arrayPrototype);
const bufferOf = descriptorOf(typedPrototype, 'buffer')!.get!;
const lengthOf = descriptorOf(typedPrototype, 'byteLength')!.get!;
const detached = descriptorOf(bufferPrototype, 'detached')?.get;
const resizable = descriptorOf(bufferPrototype, 'resizable')?.get;
const set = arrayPrototype.set;

/** Snapshot one producer chunk without consulting its methods, accessors, or species. */
export function copyTreeChunk(input: unknown): Uint8Array {
  if (
    ServerIs.Native.proxy(input) || !ServerIs.Native.uint8Array(input) ||
    prototypeOf(input) !== arrayPrototype
  ) {
    throw new TypeError('Expected an ordinary native Uint8Array');
  }
  const backing: ArrayBufferLike = bufferOf.call(input);
  const length: number = lengthOf.call(input);
  if (
    ServerIs.Native.sharedArrayBuffer(backing) || prototypeOf(backing) !== bufferPrototype ||
    detached?.call(backing) === true || resizable?.call(backing) === true ||
    length === 0 || length > 64 * 1024
  ) {
    throw new TypeError('Expected a fixed, non-empty chunk of at most 64 KiB');
  }
  const bytes = new NativeUint8Array(length);
  set.call(bytes, input);
  return bytes;
}

/** Read byte length through the captured intrinsic, not a producer-controlled prototype. */
export function byteLengthOf(bytes: Uint8Array): number {
  return lengthOf.call(bytes);
}

/** Slice only writer-owned chunks during a short-write loop. */
export function treeChunkTail(bytes: Uint8Array, offset: number): Uint8Array {
  return new NativeUint8Array(bufferOf.call(bytes), offset, lengthOf.call(bytes) - offset);
}
