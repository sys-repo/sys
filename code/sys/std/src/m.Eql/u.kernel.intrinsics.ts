/**
 * Captured platform intrinsics used by the equality kernel.
 *
 * Keeping these here makes the safety boundary obvious: supported built-ins are
 * inspected through their original prototype getters/methods so own shadowing
 * accessors are never invoked while comparing values.
 */

export const ARRAY_BUFFER_VIEW_PROTOTYPES = new Set<object>([
  DataView.prototype,
  Int8Array.prototype,
  Uint8Array.prototype,
  Uint8ClampedArray.prototype,
  Int16Array.prototype,
  Uint16Array.prototype,
  Int32Array.prototype,
  Uint32Array.prototype,
  Float32Array.prototype,
  Float64Array.prototype,
  BigInt64Array.prototype,
  BigUint64Array.prototype,
]);

const TYPED_ARRAY_PROTOTYPE = Object.getPrototypeOf(Uint8Array.prototype) as object;

export const DATE_GET_TIME = Date.prototype.getTime;
export const REGEXP_SOURCE_GET = ownGetter<RegExp, string>(RegExp.prototype, 'source');
export const REGEXP_GLOBAL_GET = ownGetter<RegExp, boolean>(RegExp.prototype, 'global');
export const REGEXP_IGNORE_CASE_GET = ownGetter<RegExp, boolean>(
  RegExp.prototype,
  'ignoreCase',
);
export const REGEXP_MULTILINE_GET = ownGetter<RegExp, boolean>(RegExp.prototype, 'multiline');
export const REGEXP_DOT_ALL_GET = ownGetter<RegExp, boolean>(RegExp.prototype, 'dotAll');
export const REGEXP_UNICODE_GET = ownGetter<RegExp, boolean>(RegExp.prototype, 'unicode');
export const REGEXP_STICKY_GET = ownGetter<RegExp, boolean>(RegExp.prototype, 'sticky');
export const REGEXP_HAS_INDICES_GET = optionalOwnGetter<RegExp, boolean>(
  RegExp.prototype,
  'hasIndices',
);
export const REGEXP_UNICODE_SETS_GET = optionalOwnGetter<RegExp, boolean>(
  RegExp.prototype,
  'unicodeSets',
);
export const ARRAY_BUFFER_BYTE_LENGTH_GET = ownGetter<ArrayBuffer, number>(
  ArrayBuffer.prototype,
  'byteLength',
);
export const DATA_VIEW_BUFFER_GET = ownGetter<DataView, ArrayBufferLike>(
  DataView.prototype,
  'buffer',
);
export const DATA_VIEW_BYTE_OFFSET_GET = ownGetter<DataView, number>(
  DataView.prototype,
  'byteOffset',
);
export const DATA_VIEW_BYTE_LENGTH_GET = ownGetter<DataView, number>(
  DataView.prototype,
  'byteLength',
);
export const TYPED_ARRAY_BUFFER_GET = ownGetter<ArrayBufferView, ArrayBufferLike>(
  TYPED_ARRAY_PROTOTYPE,
  'buffer',
);
export const TYPED_ARRAY_BYTE_OFFSET_GET = ownGetter<ArrayBufferView, number>(
  TYPED_ARRAY_PROTOTYPE,
  'byteOffset',
);
export const TYPED_ARRAY_BYTE_LENGTH_GET = ownGetter<ArrayBufferView, number>(
  TYPED_ARRAY_PROTOTYPE,
  'byteLength',
);
export const MAP_SIZE_GET = ownGetter<Map<unknown, unknown>, number>(Map.prototype, 'size');
export const SET_SIZE_GET = ownGetter<Set<unknown>, number>(Set.prototype, 'size');
export const MAP_ENTRIES = Map.prototype.entries;
export const SET_VALUES = Set.prototype.values;

function ownGetter<T extends object, R>(prototype: object, key: PropertyKey): (this: T) => R {
  const getter = Object.getOwnPropertyDescriptor(prototype, key)?.get;
  if (getter === undefined) throw new TypeError(`Missing intrinsic getter: ${String(key)}`);
  return getter as (this: T) => R;
}

function optionalOwnGetter<T extends object, R>(
  prototype: object,
  key: PropertyKey,
): ((this: T) => R) | undefined {
  return Object.getOwnPropertyDescriptor(prototype, key)?.get as
    | ((this: T) => R)
    | undefined;
}
