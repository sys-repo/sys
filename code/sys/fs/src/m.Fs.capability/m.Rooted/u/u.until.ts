import { Is, Num, Obj, ServerIs, type t } from '../common.ts';

const arrayPrototype = Array.prototype;
const freeze = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;
const ownKeys = Reflect.ownKeys;
const INVALID_UNTIL = Symbol('invalid-until');

/** Capture every lifecycle container before validating executable, live signal leaves. */
export function snapshotUntilInput(
  input: unknown,
): Readonly<{ value: t.UntilInput }> | undefined {
  try {
    const value = snapshotUntilArrays(input, new WeakSet<object>());
    if (value === INVALID_UNTIL || !isUntilSnapshot(value)) return;
    return freeze({ value });
  } catch {
    return;
  }
}

function snapshotUntilArrays(
  input: unknown,
  active: WeakSet<object>,
): unknown | typeof INVALID_UNTIL {
  if (ServerIs.Native.proxy(input) || hasProxyPrototype(input)) return INVALID_UNTIL;
  if (!Is.array(input)) return input;

  try {
    if (getPrototypeOf(input) !== arrayPrototype || active.has(input)) return INVALID_UNTIL;

    const lengthProperty = getOwnPropertyDescriptor(input, 'length');
    if (!lengthProperty || !Obj.hasOwn(lengthProperty, 'value')) return INVALID_UNTIL;
    const length = lengthProperty.value;
    if (!Num.Is.safeInt(length) || length < 0) return INVALID_UNTIL;

    const keys = ownKeys(input);
    if (keys.length !== length + 1) return INVALID_UNTIL;

    const values: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const property = getOwnPropertyDescriptor(input, String(index));
      if (!property || property.enumerable !== true || !Obj.hasOwn(property, 'value')) {
        return INVALID_UNTIL;
      }
      values[index] = property.value;
    }

    active.add(input);
    for (let index = 0; index < values.length; index += 1) {
      const value = snapshotUntilArrays(values[index], active);
      if (value === INVALID_UNTIL) return INVALID_UNTIL;
      values[index] = value;
    }
    return freeze(values);
  } catch {
    return INVALID_UNTIL;
  } finally {
    active.delete(input);
  }
}

function hasProxyPrototype(input: unknown): boolean {
  if (!Is.object(input)) return false;

  try {
    let current: object | null = input;
    while (current) {
      if (ServerIs.Native.proxy(current)) return true;
      current = getPrototypeOf(current);
    }
    return false;
  } catch {
    return true;
  }
}

function isUntilSnapshot(input: unknown): input is t.UntilInput {
  if (!Is.array(input)) return Is.untilInput(input);
  for (let index = 0; index < input.length; index += 1) {
    if (!isUntilSnapshot(input[index])) return false;
  }
  return true;
}
