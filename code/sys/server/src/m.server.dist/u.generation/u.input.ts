import { Arr, Fs, Is, Num, Obj, type t } from './common.ts';
import {
  type InputSnapshot as MaterializeInputSnapshot,
  snapshotInput as snapshotMaterializeInput,
} from '../u.materialize/u.input.ts';

const KEYS = Object.freeze({
  INPUT: Object.freeze(
    [
      'store',
      'manifestUrl',
      'integrity',
      'policy',
      'credentials',
      'until',
    ] as const,
  ),
  REQUIRED_INPUT: Object.freeze(['store', 'manifestUrl', 'integrity', 'policy'] as const),
  STORE: Object.freeze(['root', 'target'] as const),
});
const INVALID_UNTIL = Symbol('invalid-until');
const arrayPrototype = Array.prototype;
const objectPrototype = Object.prototype;
const freeze = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;
const ownKeys = Reflect.ownKeys;

/** Complete package-owned snapshot captured before generation opening starts. */
export type InputSnapshot = {
  readonly store: {
    readonly root: t.StringAbsoluteDir;
    readonly target: t.StringPath;
  };
  readonly manifest: MaterializeInputSnapshot;
  readonly until?: unknown;
};

/** Snapshot exact caller authority without invoking accessors or Proxy traps. */
export function snapshotInput(input: unknown): InputSnapshot | undefined {
  try {
    const values = exactDataValues(input, KEYS.INPUT, KEYS.REQUIRED_INPUT);
    if (!values) return;

    const storeValues = exactDataValues(values.store, KEYS.STORE, KEYS.STORE);
    if (!storeValues) return;
    const root = storeValues.root;
    const target = storeValues.target;
    if (
      !Is.str(root) || root.length === 0 || root.includes('\0') ||
      !Is.str(target) || target.length === 0 || target.includes('\0')
    ) {
      return;
    }

    if (!isSafeDataGraph(values.policy) || !isSafeDataGraph(values.credentials)) return;

    const absoluteRoot: t.StringAbsoluteDir = Fs.resolve(root);
    const materialize = snapshotMaterializeInput(freeze({
      manifestUrl: values.manifestUrl,
      integrity: values.integrity,
      storeDir: absoluteRoot,
      policy: values.policy,
      ...(values.credentials === undefined ? {} : { credentials: values.credentials }),
    }));
    if (!materialize.ok) return;

    const untilSnapshot = snapshotUntilInput(values.until);
    if (!untilSnapshot) return;
    return freeze({
      store: freeze({ root: absoluteRoot, target }),
      manifest: materialize.value,
      ...(untilSnapshot.value === undefined ? {} : { until: untilSnapshot.value }),
    });
  } catch {
    return;
  }
}

function exactDataValues<K extends string, R extends K>(
  input: unknown,
  keys: readonly K[],
  required: readonly R[],
): Readonly<Record<K, unknown>> | undefined {
  if (!isPlainDataObject(input)) return;
  const actual = ownKeys(input);
  if (
    actual.some((key) => !Is.str(key) || !keys.includes(key as K)) ||
    required.some((key) => !actual.includes(key))
  ) {
    return;
  }

  const values = Object.create(null) as Record<K, unknown>;
  for (const key of keys) {
    const descriptor = getOwnPropertyDescriptor(input, key);
    if (!descriptor) {
      values[key] = undefined;
      continue;
    }
    if (!('value' in descriptor) || descriptor.enumerable !== true) return;
    values[key] = descriptor.value;
  }
  return freeze(values);
}

/** Preflight nested policy and credential data before their owner-specific snapshotter reads it. */
function isSafeDataGraph(input: unknown): boolean {
  return visitSafeData(input, new WeakSet<object>(), new WeakSet<object>());
}

function visitSafeData(
  input: unknown,
  active: WeakSet<object>,
  complete: WeakSet<object>,
): boolean {
  if (!Is.object(input) && !Is.func(input)) return true;
  if (Is.Native.proxy(input)) return false;
  if (Is.func(input)) return true;
  if (complete.has(input)) return true;
  if (active.has(input)) return false;

  const array = Arr.isArray(input);
  if (!array && !isPlainDataObject(input)) return false;
  if (array && getPrototypeOf(input) !== arrayPrototype) return false;

  const keys = ownKeys(input);
  if (array) {
    const lengthDescriptor = getOwnPropertyDescriptor(input, 'length');
    const length = lengthDescriptor && Obj.hasOwn(lengthDescriptor, 'value')
      ? lengthDescriptor.value
      : undefined;
    if (!Num.Is.safeInt(length) || length < 0 || keys.length !== length + 1) return false;
  }

  active.add(input);
  try {
    for (const key of keys) {
      if (array && key === 'length') continue;
      if (!Is.str(key)) return false;
      const descriptor = getOwnPropertyDescriptor(input, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        return false;
      }
      if (!visitSafeData(descriptor.value, active, complete)) return false;
    }
  } finally {
    active.delete(input);
  }
  complete.add(input);
  return true;
}

/** Snapshot lifecycle containers without observing the borrowed lifecycle leaves. */
function snapshotUntilInput(input: unknown): Readonly<{ value: unknown }> | undefined {
  try {
    const value = snapshotUntilArrays(input, new WeakSet<object>());
    if (value === INVALID_UNTIL) return;
    return freeze({ value });
  } catch {
    return;
  }
}

function snapshotUntilArrays(
  input: unknown,
  active: WeakSet<object>,
): unknown | typeof INVALID_UNTIL {
  if (Is.Native.proxy(input) || hasProxyPrototype(input)) return INVALID_UNTIL;
  if (!Arr.isArray(input)) return input;

  try {
    if (getPrototypeOf(input) !== arrayPrototype || active.has(input)) return INVALID_UNTIL;
    const lengthDescriptor = getOwnPropertyDescriptor(input, 'length');
    const length = lengthDescriptor && Obj.hasOwn(lengthDescriptor, 'value')
      ? lengthDescriptor.value
      : undefined;
    if (!Num.Is.safeInt(length) || length < 0 || ownKeys(input).length !== length + 1) {
      return INVALID_UNTIL;
    }

    const values: unknown[] = [];
    // Positional traversal proves every exact dense own slot before descending.
    for (let index = 0; index < length; index += 1) {
      const descriptor = getOwnPropertyDescriptor(input, String(index));
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        return INVALID_UNTIL;
      }
      values[index] = descriptor.value;
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
      if (Is.Native.proxy(current)) return true;
      current = getPrototypeOf(current);
    }
    return false;
  } catch {
    return true;
  }
}

function isPlainDataObject(input: unknown): input is Record<PropertyKey, unknown> {
  if (!Is.object(input) || Is.Native.proxy(input)) return false;
  const prototype = getPrototypeOf(input);
  return prototype === objectPrototype || prototype === null;
}
