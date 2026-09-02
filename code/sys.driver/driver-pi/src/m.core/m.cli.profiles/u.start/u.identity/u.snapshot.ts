import { Is, StartGuiIntrinsic } from '../common.ts';

export type PropertySnapshot = Readonly<{
  key: PropertyKey;
  enumerable: boolean;
  data: boolean;
  value: unknown;
}>;

export type ObjectSnapshot = Readonly<{
  target: object;
  properties: readonly PropertySnapshot[];
}>;

export type DataSnapshot =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false }>;

const freeze = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;
const isFrozen = Object.isFrozen;
const objectPrototype = Object.prototype;
const ownKeys = Reflect.ownKeys;

const NO_DATA: DataSnapshot = freeze({ ok: false as const });

/** Snapshot one bounded direct plain object without evaluating owned accessors. */
export function snapshotObject(input: unknown, maxKeys: number): ObjectSnapshot | undefined {
  return isDirectObject(input) ? snapshotProperties(input, maxKeys) : undefined;
}

/** Admit either a plain record or Deno's bounded null-prototype listener address. */
export function snapshotListenerAddress(
  input: unknown,
  maxKeys: number,
): ObjectSnapshot | undefined {
  if (!Is.object(input) || Is.Native.proxy(input)) return;
  try {
    const prototype = getPrototypeOf(input);
    if (prototype !== objectPrototype && prototype !== null) return;
  } catch {
    return;
  }
  return snapshotProperties(input, maxKeys);
}

/** Read one enumerable data property from an admitted descriptor snapshot. */
export function ownData(input: ObjectSnapshot, key: PropertyKey): DataSnapshot {
  const property = propertyOf(input, key);
  return property?.enumerable && property.data ? { ok: true, value: property.value } : NO_DATA;
}

/** Read one enumerable data property directly without invoking caller behavior. */
export function ownDirectData(input: unknown, key: PropertyKey): DataSnapshot {
  if (!isDirectObject(input)) return NO_DATA;
  try {
    const descriptor = getOwnPropertyDescriptor(input, key);
    return descriptor?.enumerable === true && 'value' in descriptor
      ? { ok: true, value: descriptor.value }
      : NO_DATA;
  } catch {
    return NO_DATA;
  }
}

/** Resolve one retained property without invoking caller behavior. */
export function propertyOf(
  input: ObjectSnapshot,
  key: PropertyKey,
): PropertySnapshot | undefined {
  // Indexed traversal avoids ambient array-iterator authority.
  for (let index = 0; index < input.properties.length; index += 1) {
    const property = input.properties[index];
    if (property.key === key) return property;
  }
}

/** Match one descriptor snapshot against an exact enumerable data-property shape. */
export function hasExactDataShape(input: ObjectSnapshot, keys: readonly string[]): boolean {
  if (input.properties.length !== keys.length) return false;
  // Indexed traversal avoids ambient array-iterator authority.
  for (let index = 0; index < keys.length; index += 1) {
    const property = propertyOf(input, keys[index]);
    if (property?.enumerable !== true || !property.data) return false;
  }
  return true;
}

/** Admit one direct non-Proxy object record. */
export function isDirectObject(input: unknown): input is object {
  if (!Is.object(input)) return false;
  try {
    return !Is.Native.proxy(input) && getPrototypeOf(input) === objectPrototype;
  } catch {
    return false;
  }
}

/** Inspect frozen state without propagating caller behavior. */
export function isFrozenObject(input: object): boolean {
  try {
    return isFrozen(input);
  } catch {
    return false;
  }
}

function snapshotProperties(input: object, maxKeys: number): ObjectSnapshot | undefined {
  try {
    const keys = ownKeys(input);
    if (keys.length > maxKeys) return;
    const properties: PropertySnapshot[] = [];
    // Indexed traversal avoids ambient array-iterator authority.
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      const descriptor = getOwnPropertyDescriptor(input, key);
      if (!descriptor) return;
      StartGuiIntrinsic.arrayPush(
        properties,
        freeze({
          key,
          enumerable: descriptor.enumerable ?? false,
          data: 'value' in descriptor,
          value: 'value' in descriptor ? descriptor.value : undefined,
        }),
      );
    }
    return freeze({ target: input, properties: freeze(properties) });
  } catch {
    return;
  }
}
