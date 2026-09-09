import {
  ARRAY_BUFFER_BYTE_LENGTH_GET,
  DATA_VIEW_BUFFER_GET,
  DATA_VIEW_BYTE_LENGTH_GET,
  DATA_VIEW_BYTE_OFFSET_GET,
  TYPED_ARRAY_BUFFER_GET,
  TYPED_ARRAY_BYTE_LENGTH_GET,
  TYPED_ARRAY_BYTE_OFFSET_GET,
} from './u.kernel.intrinsics.ts';

/**
 * Byte-wise comparison for supported binary data values.
 */
export function equalArrayBufferViews(a: ArrayBufferView, b: ArrayBufferView) {
  const aByteLength = viewByteLength(a);
  const bByteLength = viewByteLength(b);
  if (aByteLength !== bByteLength) return false;
  return equalBytes(
    new Uint8Array(viewBuffer(a), viewByteOffset(a), aByteLength),
    new Uint8Array(viewBuffer(b), viewByteOffset(b), bByteLength),
  );
}

export function equalArrayBuffers(a: ArrayBuffer, b: ArrayBuffer) {
  const aByteLength = ARRAY_BUFFER_BYTE_LENGTH_GET.call(a);
  const bByteLength = ARRAY_BUFFER_BYTE_LENGTH_GET.call(b);
  if (aByteLength !== bByteLength) return false;
  return equalBytes(new Uint8Array(a), new Uint8Array(b));
}

function viewBuffer(value: ArrayBufferView) {
  return Object.getPrototypeOf(value) === DataView.prototype
    ? DATA_VIEW_BUFFER_GET.call(value as DataView)
    : TYPED_ARRAY_BUFFER_GET.call(value);
}

function viewByteOffset(value: ArrayBufferView) {
  return Object.getPrototypeOf(value) === DataView.prototype
    ? DATA_VIEW_BYTE_OFFSET_GET.call(value as DataView)
    : TYPED_ARRAY_BYTE_OFFSET_GET.call(value);
}

function viewByteLength(value: ArrayBufferView) {
  return Object.getPrototypeOf(value) === DataView.prototype
    ? DATA_VIEW_BYTE_LENGTH_GET.call(value as DataView)
    : TYPED_ARRAY_BYTE_LENGTH_GET.call(value);
}

function equalBytes(a: Uint8Array, b: Uint8Array) {
  if (a.byteLength !== b.byteLength) return false;
  return a.every((byte, index) => byte === b[index]);
}
