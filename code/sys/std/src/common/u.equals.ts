/**
 * Canonical structural equality kernel for `@sys/std`.
 *
 * This is the single implementation behind `Obj.eql`, `@sys/std/eql`, and
 * the legacy `R.equals` compatibility facade. It is intentionally not a
 * universal JavaScript object inspector. It supports a pure data domain and
 * treats unsupported behavioral or opaque objects as identity-only values.
 *
 * Supported domain:
 * - primitives compare with `Object.is`;
 * - plain records and arrays compare by prototype, extensibility, own keys,
 *   property descriptors, and recursively compared data values;
 * - Date, RegExp, ArrayBuffer/views, Map, and Set have explicit value support;
 * - cyclic/shared references preserve graph topology through a bijective
 *   left↔right object mapping;
 * - unsupported objects with hidden/internal state compare equal only by
 *   identity through the initial `Object.is` check.
 */

type Seen = { readonly left: WeakMap<object, object>; readonly right: WeakMap<object, object> };
type SeenMark = { readonly left: object; readonly right: object };
type ValueKind =
  | 'array'
  | 'array-buffer'
  | 'array-buffer-view'
  | 'date'
  | 'map'
  | 'opaque'
  | 'record'
  | 'regexp'
  | 'set';

/**
 * Compare two values using the supported structural equality relation.
 *
 * Primitives use `Object.is`. Supported data objects are compared deeply with
 * descriptor and graph-topology awareness. Unsupported opaque objects compare
 * equal only when they are the same identity.
 */
export function equals(a: unknown, b: unknown): boolean {
  return deepEquals(a, b, { left: new WeakMap(), right: new WeakMap() });
}

/**
 * Return the first value from each structural-equality class.
 */
export function unique<T>(values: readonly T[]): T[] {
  const res: T[] = [];
  for (const value of values) {
    if (!res.some((existing) => equals(existing, value))) res.push(value);
  }
  return res;
}

/**
 * Return the first item for each structurally unique key.
 */
export function uniqueBy<T>(fn: (value: T) => unknown, values: readonly T[]): T[] {
  const res: T[] = [];
  const seen: unknown[] = [];
  for (const value of values) {
    const key = fn(value);
    if (seen.some((existing) => equals(existing, key))) continue;
    seen.push(key);
    res.push(value);
  }
  return res;
}

/**
 * Helpers:
 */

const ARRAY_BUFFER_VIEW_PROTOTYPES = new Set<object>([
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
const DATE_GET_TIME = Date.prototype.getTime;
const REGEXP_SOURCE_GET = ownGetter<RegExp, string>(RegExp.prototype, 'source');
const REGEXP_GLOBAL_GET = ownGetter<RegExp, boolean>(RegExp.prototype, 'global');
const REGEXP_IGNORE_CASE_GET = ownGetter<RegExp, boolean>(RegExp.prototype, 'ignoreCase');
const REGEXP_MULTILINE_GET = ownGetter<RegExp, boolean>(RegExp.prototype, 'multiline');
const REGEXP_DOT_ALL_GET = ownGetter<RegExp, boolean>(RegExp.prototype, 'dotAll');
const REGEXP_UNICODE_GET = ownGetter<RegExp, boolean>(RegExp.prototype, 'unicode');
const REGEXP_STICKY_GET = ownGetter<RegExp, boolean>(RegExp.prototype, 'sticky');
const REGEXP_HAS_INDICES_GET = optionalOwnGetter<RegExp, boolean>(RegExp.prototype, 'hasIndices');
const REGEXP_UNICODE_SETS_GET = optionalOwnGetter<RegExp, boolean>(
  RegExp.prototype,
  'unicodeSets',
);
const ARRAY_BUFFER_BYTE_LENGTH_GET = ownGetter<ArrayBuffer, number>(
  ArrayBuffer.prototype,
  'byteLength',
);
const DATA_VIEW_BUFFER_GET = ownGetter<DataView, ArrayBufferLike>(DataView.prototype, 'buffer');
const DATA_VIEW_BYTE_OFFSET_GET = ownGetter<DataView, number>(
  DataView.prototype,
  'byteOffset',
);
const DATA_VIEW_BYTE_LENGTH_GET = ownGetter<DataView, number>(
  DataView.prototype,
  'byteLength',
);
const TYPED_ARRAY_BUFFER_GET = ownGetter<ArrayBufferView, ArrayBufferLike>(
  TYPED_ARRAY_PROTOTYPE,
  'buffer',
);
const TYPED_ARRAY_BYTE_OFFSET_GET = ownGetter<ArrayBufferView, number>(
  TYPED_ARRAY_PROTOTYPE,
  'byteOffset',
);
const TYPED_ARRAY_BYTE_LENGTH_GET = ownGetter<ArrayBufferView, number>(
  TYPED_ARRAY_PROTOTYPE,
  'byteLength',
);
const MAP_SIZE_GET = ownGetter<Map<unknown, unknown>, number>(Map.prototype, 'size');
const SET_SIZE_GET = ownGetter<Set<unknown>, number>(Set.prototype, 'size');
const MAP_ENTRIES = Map.prototype.entries;
const SET_VALUES = Set.prototype.values;

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

function deepEquals(a: unknown, b: unknown, seen: Seen, trail?: SeenMark[]): boolean {
  if (Object.is(a, b)) {
    if (!isObjectLike(a) || !isObjectLike(b)) return true;
    const seenPair = markSeen(a, b, seen, trail);
    return seenPair ?? true;
  }
  if (!isObjectLike(a) || !isObjectLike(b)) return false;

  const kind = valueKind(a);
  if (kind === 'opaque' || kind !== valueKind(b)) return false;
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;

  const seenPair = markSeen(a, b, seen, trail);
  if (seenPair !== undefined) return seenPair;

  switch (kind) {
    case 'array':
      return Array.isArray(a) && Array.isArray(b) && equalOwnProperties(a, b, seen, trail);

    case 'array-buffer':
      return equalArrayBuffers(a as ArrayBuffer, b as ArrayBuffer) &&
        equalOwnProperties(a, b, seen, trail);

    case 'array-buffer-view':
      return ArrayBuffer.isView(a) &&
        ArrayBuffer.isView(b) &&
        equalArrayBufferViews(a, b) &&
        equalOwnProperties(a, b, seen, trail);

    case 'date':
      return equalDates(a as Date, b as Date) && equalOwnProperties(a, b, seen, trail);

    case 'map':
      return equalOwnProperties(a, b, seen, trail) &&
        equalMaps(a as Map<unknown, unknown>, b as Map<unknown, unknown>, seen, trail);

    case 'record':
      return equalOwnProperties(a, b, seen, trail);

    case 'regexp':
      return equalRegExps(a as RegExp, b as RegExp) && equalOwnProperties(a, b, seen, trail);

    case 'set':
      return equalOwnProperties(a, b, seen, trail) &&
        equalSets(a as Set<unknown>, b as Set<unknown>, seen, trail);
  }
}

function isObjectLike(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

function valueKind(value: object): ValueKind {
  const proto = Object.getPrototypeOf(value);
  if (Array.isArray(value)) return proto === Array.prototype ? 'array' : 'opaque';
  if (proto === Date.prototype) return hasDateBrand(value) ? 'date' : 'opaque';
  if (proto === RegExp.prototype) return hasRegExpBrand(value) ? 'regexp' : 'opaque';
  if (ArrayBuffer.isView(value)) {
    return isSupportedArrayBufferView(value) ? 'array-buffer-view' : 'opaque';
  }
  if (proto === ArrayBuffer.prototype) {
    return hasArrayBufferBrand(value) ? 'array-buffer' : 'opaque';
  }
  if (proto === Map.prototype) return hasMapBrand(value) ? 'map' : 'opaque';
  if (proto === Set.prototype) return hasSetBrand(value) ? 'set' : 'opaque';
  return isPlainRecord(value) ? 'record' : 'opaque';
}

function hasDateBrand(value: object): boolean {
  try {
    DATE_GET_TIME.call(value as Date);
    return true;
  } catch {
    return false;
  }
}

function hasRegExpBrand(value: object): boolean {
  try {
    REGEXP_SOURCE_GET.call(value as RegExp);
    REGEXP_GLOBAL_GET.call(value as RegExp);
    return true;
  } catch {
    return false;
  }
}

function hasArrayBufferBrand(value: object): boolean {
  try {
    ARRAY_BUFFER_BYTE_LENGTH_GET.call(value as ArrayBuffer);
    return true;
  } catch {
    return false;
  }
}

function hasMapBrand(value: object): boolean {
  try {
    MAP_SIZE_GET.call(value as Map<unknown, unknown>);
    return true;
  } catch {
    return false;
  }
}

function hasSetBrand(value: object): boolean {
  try {
    SET_SIZE_GET.call(value as Set<unknown>);
    return true;
  } catch {
    return false;
  }
}

function isSupportedArrayBufferView(value: ArrayBufferView): boolean {
  return ARRAY_BUFFER_VIEW_PROTOTYPES.has(Object.getPrototypeOf(value));
}

function isPlainRecord(value: object): boolean {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function equalOwnProperties(a: object, b: object, seen: Seen, trail?: SeenMark[]) {
  if (Object.isExtensible(a) !== Object.isExtensible(b)) return false;

  const aKeys = Reflect.ownKeys(a);
  const bKeys = Reflect.ownKeys(b);
  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every((key) => {
    if (!bKeys.includes(key)) return false;
    const aDescriptor = Object.getOwnPropertyDescriptor(a, key);
    const bDescriptor = Object.getOwnPropertyDescriptor(b, key);
    return aDescriptor !== undefined &&
      bDescriptor !== undefined &&
      equalDescriptors(aDescriptor, bDescriptor, seen, trail);
  });
}

function equalDescriptors(
  a: PropertyDescriptor,
  b: PropertyDescriptor,
  seen: Seen,
  trail?: SeenMark[],
) {
  if (a.enumerable !== b.enumerable || a.configurable !== b.configurable) return false;

  const aData = isDataDescriptor(a);
  const bData = isDataDescriptor(b);
  if (aData !== bData) return false;

  if (aData && bData) {
    return a.writable === b.writable && deepEquals(a.value, b.value, seen, trail);
  }

  return a.get === b.get && a.set === b.set;
}

function isDataDescriptor(
  descriptor: PropertyDescriptor,
): descriptor is PropertyDescriptor & { readonly value: unknown; readonly writable: boolean } {
  return 'value' in descriptor || 'writable' in descriptor;
}

function equalDates(a: Date, b: Date) {
  return Object.is(DATE_GET_TIME.call(a), DATE_GET_TIME.call(b));
}

function equalRegExps(a: RegExp, b: RegExp) {
  return REGEXP_SOURCE_GET.call(a) === REGEXP_SOURCE_GET.call(b) &&
    REGEXP_GLOBAL_GET.call(a) === REGEXP_GLOBAL_GET.call(b) &&
    REGEXP_IGNORE_CASE_GET.call(a) === REGEXP_IGNORE_CASE_GET.call(b) &&
    REGEXP_MULTILINE_GET.call(a) === REGEXP_MULTILINE_GET.call(b) &&
    REGEXP_DOT_ALL_GET.call(a) === REGEXP_DOT_ALL_GET.call(b) &&
    REGEXP_UNICODE_GET.call(a) === REGEXP_UNICODE_GET.call(b) &&
    REGEXP_STICKY_GET.call(a) === REGEXP_STICKY_GET.call(b) &&
    callOptionalGetter(REGEXP_HAS_INDICES_GET, a) ===
      callOptionalGetter(REGEXP_HAS_INDICES_GET, b) &&
    callOptionalGetter(REGEXP_UNICODE_SETS_GET, a) ===
      callOptionalGetter(REGEXP_UNICODE_SETS_GET, b);
}

function callOptionalGetter<T extends object, R>(getter: ((this: T) => R) | undefined, value: T) {
  return getter?.call(value);
}

function equalArrayBufferViews(a: ArrayBufferView, b: ArrayBufferView) {
  const aByteLength = viewByteLength(a);
  const bByteLength = viewByteLength(b);
  if (aByteLength !== bByteLength) return false;
  return equalBytes(
    new Uint8Array(viewBuffer(a), viewByteOffset(a), aByteLength),
    new Uint8Array(viewBuffer(b), viewByteOffset(b), bByteLength),
  );
}

function equalArrayBuffers(a: ArrayBuffer, b: ArrayBuffer) {
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

function equalMaps(
  a: Map<unknown, unknown>,
  b: Map<unknown, unknown>,
  seen: Seen,
  trail?: SeenMark[],
) {
  if (MAP_SIZE_GET.call(a) !== MAP_SIZE_GET.call(b)) return false;
  return matchMapEntries(
    Array.from(MAP_ENTRIES.call(a)),
    Array.from(MAP_ENTRIES.call(b)),
    seen,
    trail,
  );
}

function equalSets(
  a: Set<unknown>,
  b: Set<unknown>,
  seen: Seen,
  trail?: SeenMark[],
) {
  if (SET_SIZE_GET.call(a) !== SET_SIZE_GET.call(b)) return false;
  return matchSetValues(
    Array.from(SET_VALUES.call(a)),
    Array.from(SET_VALUES.call(b)),
    seen,
    trail,
  );
}

function matchMapEntries(
  aEntries: readonly (readonly [unknown, unknown])[],
  bEntries: readonly (readonly [unknown, unknown])[],
  seen: Seen,
  parentTrail?: SeenMark[],
): boolean {
  if (aEntries.length === 0) return true;
  const [aEntry, ...restA] = aEntries;

  for (const [candidateIndex, bEntry] of bEntries.entries()) {
    const branchTrail: SeenMark[] = [];
    const keysMatch = deepEquals(aEntry[0], bEntry[0], seen, branchTrail);
    const valuesMatch = keysMatch && deepEquals(aEntry[1], bEntry[1], seen, branchTrail);

    if (valuesMatch) {
      const restB = bEntries.filter((_, index) => index !== candidateIndex);
      if (matchMapEntries(restA, restB, seen, branchTrail)) {
        parentTrail?.push(...branchTrail);
        return true;
      }
    }

    rollback(branchTrail, seen);
  }

  return false;
}

function matchSetValues(
  aValues: readonly unknown[],
  bValues: readonly unknown[],
  seen: Seen,
  parentTrail?: SeenMark[],
): boolean {
  if (aValues.length === 0) return true;
  const [aValue, ...restA] = aValues;

  for (const [candidateIndex, bValue] of bValues.entries()) {
    const branchTrail: SeenMark[] = [];

    if (deepEquals(aValue, bValue, seen, branchTrail)) {
      const restB = bValues.filter((_, index) => index !== candidateIndex);
      if (matchSetValues(restA, restB, seen, branchTrail)) {
        parentTrail?.push(...branchTrail);
        return true;
      }
    }

    rollback(branchTrail, seen);
  }

  return false;
}

function markSeen(a: object, b: object, seen: Seen, trail?: SeenMark[]): boolean | undefined {
  const mappedRight = seen.left.get(a);
  if (mappedRight !== undefined) return mappedRight === b;

  const mappedLeft = seen.right.get(b);
  if (mappedLeft !== undefined) return mappedLeft === a;

  seen.left.set(a, b);
  seen.right.set(b, a);
  trail?.push({ left: a, right: b });
  return undefined;
}

function rollback(trail: readonly SeenMark[], seen: Seen) {
  for (const mark of [...trail].reverse()) {
    seen.left.delete(mark.left);
    seen.right.delete(mark.right);
  }
}
