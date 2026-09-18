import { Pkg, ServerIs, type t } from './common.ts';
import { snapshotExactDataObject, snapshotUntilInput, snapshotVerifyLimits } from './u.input.ts';
import { failure } from './u.pinned.io.ts';

const NativeUint8Array = Uint8Array;
const typedArrayPrototype = Object.getPrototypeOf(NativeUint8Array.prototype);
const byteLength = Object.getOwnPropertyDescriptor(typedArrayPrototype, 'byteLength')!.get!;
const buffer = Object.getOwnPropertyDescriptor(typedArrayPrototype, 'buffer')!.get!;

/** Capture bytes, checksum, and limits before lifecycle getters can change caller data. */
export function snapshotManifestArgs(input: unknown): t.Pkg.Dist.Pinned.AdmitManifest.Args {
  const values = snapshotExactDataObject(input, {
    ALLOWED: ['bytes', 'integrity', 'limits', 'until'],
    REQUIRED: ['bytes', 'integrity', 'limits'],
  });
  if (!values) throw failure('invalid-input');

  const parsed = Pkg.Dist.Part.parse(values.integrity);
  if (!parsed || parsed.hash !== values.integrity || parsed.size !== undefined) {
    throw failure('invalid-input');
  }
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
  return Object.freeze({ bytes, integrity: parsed.hash, limits, until: until.value });
}
