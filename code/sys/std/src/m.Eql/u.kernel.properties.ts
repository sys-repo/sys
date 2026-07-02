import type { DeepEquals, Seen, SeenMark } from './t.kernel.ts';

/**
 * Own-property comparison for records, arrays, and supported built-in state.
 *
 * The descriptor path is intentionally accessor-safe: getters and setters are
 * compared by identity and are not invoked.
 */
export function equalOwnProperties(
  a: object,
  b: object,
  seen: Seen,
  deepEquals: DeepEquals,
  trail?: SeenMark[],
) {
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
      equalDescriptors(aDescriptor, bDescriptor, seen, deepEquals, trail);
  });
}

function equalDescriptors(
  a: PropertyDescriptor,
  b: PropertyDescriptor,
  seen: Seen,
  deepEquals: DeepEquals,
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
