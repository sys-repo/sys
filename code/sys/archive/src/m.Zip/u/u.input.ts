import { Is, Num, type t } from '../common.ts';
import { failure, isFailure } from './u.failure.ts';

const NativeArray = Array;
const NativeArrayBuffer = ArrayBuffer;
const NativeUint8Array = Uint8Array;
const NativeObject = Object;
const ownKeys = Reflect.ownKeys;
const getPrototypeOf = NativeObject.getPrototypeOf;
const getOwnPropertyDescriptor = NativeObject.getOwnPropertyDescriptor;
const getOwnPropertyDescriptors = NativeObject.getOwnPropertyDescriptors;
const typedArrayPrototype = getPrototypeOf(NativeUint8Array.prototype);
const getTypedArrayBuffer = NativeObject.getOwnPropertyDescriptor(typedArrayPrototype, 'buffer')!
  .get!;
const getTypedArrayByteLength = NativeObject.getOwnPropertyDescriptor(
  typedArrayPrototype,
  'byteLength',
)!.get!;
const getTypedArrayByteOffset = NativeObject.getOwnPropertyDescriptor(
  typedArrayPrototype,
  'byteOffset',
)!.get!;
const getArrayBufferByteLength = NativeObject.getOwnPropertyDescriptor(
  NativeArrayBuffer.prototype,
  'byteLength',
)!.get!;
const setTypedArray = NativeObject.getOwnPropertyDescriptor(typedArrayPrototype, 'set')!.value as (
  this: Uint8Array,
  source: Uint8Array,
  offset?: number,
) => void;
const getArrayBufferDetached = NativeObject.getOwnPropertyDescriptor(
  NativeArrayBuffer.prototype,
  'detached',
)?.get;
const getArrayBufferResizable = NativeObject.getOwnPropertyDescriptor(
  NativeArrayBuffer.prototype,
  'resizable',
)?.get;

type Allocate = (length: number) => Uint8Array;
type UntilBudget = { nodes: number };

const MAX_UNTIL_NODES = 256;
const MAX_UNTIL_DEPTH = 32;

/** Bounded ZIP32 defaults used when callers omit individual limit overrides. */
export const DEFAULT_LIMITS: Readonly<t.Zip.Limits> = Object.freeze({
  maxSourceBytes: 64 * 1024 * 1024,
  maxEntries: 2048,
  maxTreeEntries: 8192,
  maxPathBytes: 512,
  maxPathDepth: 32,
  maxEntryBytes: 128 * 1024 * 1024,
  maxExpandedBytes: 512 * 1024 * 1024,
  maxErrorChars: 16_000,
});

const LIMIT_KEYS = [
  'maxSourceBytes',
  'maxEntries',
  'maxTreeEntries',
  'maxPathBytes',
  'maxPathDepth',
  'maxEntryBytes',
  'maxExpandedBytes',
  'maxErrorChars',
] as const satisfies readonly (keyof t.Zip.Limits)[];

export type OpenInput = {
  readonly until?: t.UntilInput;
  readonly timeout: t.Msecs;
  readonly limits: t.Zip.Limits;
};

export type WorkInput = {
  readonly until?: t.UntilInput;
  readonly timeout: t.Msecs;
};

/** Snapshot one exact open-options record without invoking its properties. */
export function openOptions(input: unknown): OpenInput {
  let maxErrorChars = openErrorLimit(input);
  try {
    const values = exactRecord(input, ['timeout'], ['until', 'limits']);
    const limits = limitOptions(values.limits);
    maxErrorChars = limits.maxErrorChars;
    const timeout = finiteTimeout(values.timeout);
    const until = untilInput(values.until);
    return Object.freeze({ ...(until === undefined ? {} : { until }), timeout, limits });
  } catch (cause) {
    throw failure('open', 'invalid-options', { maxErrorChars, cause });
  }
}

/** Snapshot one exact work-options record without invoking its properties. */
export function workOptions(input: unknown, maxErrorChars: number): WorkInput {
  try {
    const values = exactRecord(input, ['timeout'], ['until']);
    const timeout = finiteTimeout(values.timeout);
    const until = untilInput(values.until);
    return Object.freeze({ ...(until === undefined ? {} : { until }), timeout });
  } catch (cause) {
    throw failure('test', 'invalid-options', { maxErrorChars, cause });
  }
}

/**
 * Admit and own caller bytes through captured typed-array intrinsics.
 * The allocator parameter is internal test instrumentation and is never public API.
 */
export function copySource(
  input: unknown,
  limits: t.Zip.Limits,
  allocate: Allocate = (length) => new NativeUint8Array(length),
): Uint8Array {
  const maxErrorChars = limits.maxErrorChars;
  if (Is.Native.proxy(input) || !Is.Native.uint8Array(input)) {
    throw failure('open', 'invalid-input', { maxErrorChars });
  }

  let sourceLength: number;
  let backing: ArrayBufferLike;
  try {
    if (getPrototypeOf(input) !== NativeUint8Array.prototype) {
      throw failure('open', 'invalid-input', { maxErrorChars });
    }
    sourceLength = getTypedArrayByteLength.call(input) as number;
    backing = getTypedArrayBuffer.call(input) as ArrayBufferLike;
  } catch (cause) {
    if (isFailure(cause)) throw cause;
    throw failure('open', 'invalid-input', { maxErrorChars, cause });
  }

  if (Is.Native.sharedArrayBuffer(backing)) {
    throw failure('open', 'invalid-input', { maxErrorChars });
  }
  if (getPrototypeOf(backing) !== NativeArrayBuffer.prototype) {
    throw failure('open', 'invalid-input', { maxErrorChars });
  }

  try {
    if (getArrayBufferDetached?.call(backing) === true) {
      throw failure('open', 'invalid-input', { maxErrorChars });
    }
    if (getArrayBufferResizable?.call(backing) === true) {
      throw failure('open', 'invalid-input', { maxErrorChars });
    }
  } catch (cause) {
    if (isFailure(cause)) throw cause;
    throw failure('open', 'invalid-input', { maxErrorChars, cause });
  }

  if (sourceLength > limits.maxSourceBytes) {
    throw failure('open', 'source-limit', { maxErrorChars });
  }

  let owned: Uint8Array;
  try {
    owned = allocate(sourceLength);
    const ownedBacking = getTypedArrayBuffer.call(owned) as ArrayBufferLike;
    if (
      Is.Native.proxy(owned) ||
      !Is.Native.uint8Array(owned) ||
      getPrototypeOf(owned) !== NativeUint8Array.prototype ||
      getTypedArrayByteLength.call(owned) !== sourceLength ||
      getTypedArrayByteOffset.call(owned) !== 0 ||
      Is.Native.sharedArrayBuffer(ownedBacking) ||
      getPrototypeOf(ownedBacking) !== NativeArrayBuffer.prototype ||
      getArrayBufferByteLength.call(ownedBacking) !== sourceLength ||
      getArrayBufferDetached?.call(ownedBacking) === true ||
      getArrayBufferResizable?.call(ownedBacking) === true
    ) {
      throw new TypeError('Allocator returned an invalid ZIP byte owner');
    }
    setTypedArray.call(owned, input, 0);
    if (
      getTypedArrayByteLength.call(input) !== sourceLength ||
      getTypedArrayByteLength.call(owned) !== sourceLength
    ) {
      throw new TypeError('ZIP source changed while being copied');
    }
  } catch (cause) {
    throw failure('open', 'invalid-input', { maxErrorChars, cause });
  }

  return owned;
}

function openErrorLimit(input: unknown): number {
  return errorLimit(dataProperty(input, 'limits'));
}

function errorLimit(input: unknown): number {
  const candidate = dataProperty(input, 'maxErrorChars');
  return Num.Is.safeInt(candidate) && candidate > 0 ? candidate : DEFAULT_LIMITS.maxErrorChars;
}

function dataProperty(input: unknown, key: string): unknown {
  try {
    if (
      !Is.object(input) || Is.Native.proxy(input) ||
      getPrototypeOf(input) !== NativeObject.prototype
    ) {
      return undefined;
    }
    const descriptor = getOwnPropertyDescriptors(input)[key];
    return descriptor && 'value' in descriptor && descriptor.enumerable === true
      ? descriptor.value
      : undefined;
  } catch {
    return undefined;
  }
}

function limitOptions(input: unknown): t.Zip.Limits {
  const values = input === undefined ? {} : exactRecord(input, [], LIMIT_KEYS);
  const limits = {} as Record<keyof t.Zip.Limits, number>;
  for (const key of LIMIT_KEYS) {
    const override = values[key];
    const value = override === undefined ? DEFAULT_LIMITS[key] : override;
    if (!Num.Is.safeInt(value) || value <= 0) throw invalidOptions();
    limits[key] = value;
  }
  return Object.freeze(limits) as t.Zip.Limits;
}

function finiteTimeout(input: unknown): t.Msecs {
  if (!Num.Is.safeInt(input) || input < 0) throw invalidOptions();
  return input as t.Msecs;
}

function untilInput(input: unknown): t.UntilInput | undefined {
  if (input === undefined) return undefined;
  try {
    return snapshotUntil(input, new WeakSet<object>(), { nodes: 0 }, 0);
  } catch (cause) {
    if (isFailure(cause)) throw cause;
    throw invalidOptions(cause);
  }
}

function snapshotUntil(
  input: unknown,
  seen: WeakSet<object>,
  budget: UntilBudget,
  arrayDepth: number,
): t.UntilInput {
  if (!Is.object(input) || Is.Native.proxy(input)) throw invalidOptions();
  consumeUntilNode(budget);
  if (!Is.array(input)) {
    if (hasProxyPrototype(input) || !Is.untilInput(input)) throw invalidOptions();
    return input as t.UntilInput;
  }

  if (
    arrayDepth >= MAX_UNTIL_DEPTH ||
    getPrototypeOf(input) !== NativeArray.prototype ||
    seen.has(input)
  ) {
    throw invalidOptions();
  }
  seen.add(input);

  const lengthDescriptor = getOwnPropertyDescriptor(input, 'length');
  if (!lengthDescriptor || !('value' in lengthDescriptor)) throw invalidOptions();
  const length = lengthDescriptor.value;
  if (
    !Num.Is.safeInt(length) ||
    length < 0 ||
    length > MAX_UNTIL_NODES - budget.nodes
  ) {
    throw invalidOptions();
  }

  const descriptors = getOwnPropertyDescriptors(input);
  const keys = ownKeys(input);
  if (keys.length !== length + 1) throw invalidOptions();
  const snapshot: t.UntilInput[] = [];
  for (let index = 0; index < length; index++) {
    const descriptor = descriptors[String(index)];
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
      throw invalidOptions();
    }
    snapshot.push(snapshotUntilValue(descriptor.value, seen, budget, arrayDepth + 1));
  }
  if (keys.some((key) => key !== 'length' && !/^\d+$/u.test(String(key)))) throw invalidOptions();
  return Object.freeze(snapshot) as t.UntilInput;
}

function snapshotUntilValue(
  input: unknown,
  seen: WeakSet<object>,
  budget: UntilBudget,
  arrayDepth: number,
): t.UntilInput {
  if (input === undefined) {
    consumeUntilNode(budget);
    return undefined;
  }
  return snapshotUntil(input, seen, budget, arrayDepth);
}

function consumeUntilNode(budget: UntilBudget): void {
  budget.nodes++;
  if (budget.nodes > MAX_UNTIL_NODES) throw invalidOptions();
}

function hasProxyPrototype(input: object): boolean {
  let current = getPrototypeOf(input);
  while (current) {
    if (Is.Native.proxy(current)) return true;
    current = getPrototypeOf(current);
  }
  return false;
}

function exactRecord(
  input: unknown,
  required: readonly string[],
  optional: readonly string[],
): Record<string, unknown> {
  if (
    !Is.object(input) || Is.Native.proxy(input) || getPrototypeOf(input) !== NativeObject.prototype
  ) {
    throw invalidOptions();
  }

  let descriptors: PropertyDescriptorMap;
  let keys: readonly PropertyKey[];
  try {
    descriptors = getOwnPropertyDescriptors(input);
    keys = ownKeys(input);
  } catch (cause) {
    throw invalidOptions(cause);
  }

  const allowed = new Set([...required, ...optional]);
  if (keys.some((key) => !Is.str(key) || !allowed.has(key))) throw invalidOptions();
  if (required.some((key) => !keys.includes(key))) throw invalidOptions();

  const output: Record<string, unknown> = {};
  for (const key of keys) {
    const descriptor = descriptors[key as string];
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
      throw invalidOptions();
    }
    output[key as string] = descriptor.value;
  }
  return output;
}

function invalidOptions(cause?: unknown): t.Zip.Failure.Error {
  return failure('open', 'invalid-options', { cause });
}
