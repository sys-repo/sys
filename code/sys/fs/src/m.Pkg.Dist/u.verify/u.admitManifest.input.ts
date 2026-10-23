import { ServerIs, type t } from './common.ts';
import {
  snapshotExactDataObject,
  snapshotPin,
  snapshotUntilInput,
  snapshotVerifyLimits,
} from './u.input.ts';
import { failure } from './u.io.ts';

const NativeUint8Array = Uint8Array;
const typedArrayPrototype = Object.getPrototypeOf(NativeUint8Array.prototype);
const byteLength = Object.getOwnPropertyDescriptor(typedArrayPrototype, 'byteLength')!.get!;
const buffer = Object.getOwnPropertyDescriptor(typedArrayPrototype, 'buffer')!.get!;

/** Capture bytes, pin, and limits before lifecycle getters can change caller data. */
export function snapshotManifestArgs(input: unknown): t.Pkg.Dist.Pinned.AdmitManifest.Args {
  const values = snapshotExactDataObject(input, {
    ALLOWED: ['bytes', 'pin', 'limits', 'until'],
    REQUIRED: ['bytes', 'pin', 'limits'],
  });
  if (!values) throw failure('invalid-input');

  const pin = snapshotPin(values.pin);
  if (!pin) throw failure('invalid-input');
  const limits = snapshotVerifyLimits(values.limits);
  if (!limits) throw failure('invalid-input');

  const source = values.bytes;
  if (!ServerIs.Native.uint8Array(source)) throw failure('invalid-input');
  if (ServerIs.Native.sharedArrayBuffer(buffer.call(source))) throw failure('invalid-input');
  if (byteLength.call(source) > limits.manifestBytes) throw failure('limit-exceeded');
  // Native typed-array construction copies internal slots, not caller getters/iterators/species.
  // Detached storage throws before a snapshot can be admitted.
  const bytes = new NativeUint8Array(source);

  const until = snapshotUntilInput(values.until);
  if (!until) throw failure('invalid-input');
  return Object.freeze({ bytes, pin, limits, until: until.value });
}
