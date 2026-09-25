/**
 * Import-free synchronous integrity primitives. Owners evaluate this module before dependencies
 * whose ambient operations they need to capture or monitor.
 */
type DescriptorSnapshot = Readonly<{
  readonly key: PropertyKey;
  readonly descriptor: Readonly<PropertyDescriptor>;
}>;

type PropertySnapshot = Readonly<{
  readonly kind: 'property';
  readonly target: object;
  readonly key: PropertyKey;
  readonly descriptor?: Readonly<PropertyDescriptor>;
}>;

type ShapeSnapshot = Readonly<{
  readonly kind: 'shape';
  readonly target: object;
  readonly prototype: object | null;
  readonly extensible: boolean;
  readonly descriptors: readonly DescriptorSnapshot[];
}>;

export type AuthoritySnapshot = PropertySnapshot | ShapeSnapshot;
export type AuthorityCheck = () => boolean;

export type SynchronousAuthority = Readonly<{
  /** Whether every captured owner still matches its trusted module-initialization baseline. */
  isReady(): boolean;
  /** Refuse work when any captured owner no longer matches its baseline. */
  assert(): void;
  /** Re-admit immediately before and after one caller-owned synchronous operation. */
  run<T>(operation: () => T): T;
}>;

const NativeArray = Array;
const NativeError = Error;
const apply = Reflect.apply;
const arrayPush = NativeArray.prototype.push;
const freeze = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;
const isExtensible = Object.isExtensible;
const objectIs = Object.is;
const ownKeys = Reflect.ownKeys;

/** Snapshot one exact own property without invoking accessors. Missing properties remain meaningful. */
export function snapshotProperty(target: object, key: PropertyKey): AuthoritySnapshot {
  const descriptor = getOwnPropertyDescriptor(target, key);
  return freeze({
    kind: 'property',
    target,
    key,
    descriptor: descriptor ? snapshotDescriptor(descriptor) : undefined,
  });
}

/** Snapshot one complete own shape, its prototype identity, and extensibility. */
export function snapshotShape(target: object): AuthoritySnapshot {
  const keys = ownKeys(target);
  const descriptors: DescriptorSnapshot[] = [];
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const descriptor = getOwnPropertyDescriptor(target, key);
    if (!descriptor) throw new NativeError('CLI authority snapshot failed.');
    apply(arrayPush, descriptors, [freeze({ key, descriptor: snapshotDescriptor(descriptor) })]);
  }
  return freeze({
    kind: 'shape',
    target,
    prototype: getPrototypeOf(target),
    extensible: isExtensible(target),
    descriptors: freeze(descriptors),
  });
}

/** Compare captured descriptors without invoking current accessors or prototype methods. */
export function snapshotsReady(snapshots: readonly AuthoritySnapshot[]): boolean {
  try {
    for (let index = 0; index < snapshots.length; index += 1) {
      const snapshot = snapshots[index];
      if (snapshot.kind === 'property') {
        const actual = getOwnPropertyDescriptor(snapshot.target, snapshot.key);
        if (!sameDescriptor(actual, snapshot.descriptor)) return false;
        continue;
      }

      if (
        getPrototypeOf(snapshot.target) !== snapshot.prototype ||
        isExtensible(snapshot.target) !== snapshot.extensible
      ) {
        return false;
      }

      const keys = ownKeys(snapshot.target);
      if (keys.length !== snapshot.descriptors.length) return false;
      for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
        const expected = snapshot.descriptors[keyIndex];
        if (keys[keyIndex] !== expected.key) return false;
        const actual = getOwnPropertyDescriptor(snapshot.target, expected.key);
        if (!sameDescriptor(actual, expected.descriptor)) return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

/** Create a fixed synchronous gate over trusted, import-time authority checks. */
export function createSynchronousAuthority(
  message: string,
  sourceChecks: readonly AuthorityCheck[],
): SynchronousAuthority {
  const checks: AuthorityCheck[] = [];
  for (let index = 0; index < sourceChecks.length; index += 1) {
    apply(arrayPush, checks, [sourceChecks[index]]);
  }
  freeze(checks);

  const failure = new NativeError(message);
  freeze(failure);

  const isReady = () => {
    try {
      for (let index = 0; index < checks.length; index += 1) {
        if (!checks[index]()) return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const assert = () => {
    if (!isReady()) throw failure;
  };

  const run = <T>(operation: () => T): T => {
    assert();
    try {
      const result = operation();
      assert();
      return result;
    } catch (cause) {
      assert();
      throw cause;
    }
  };

  return freeze({ isReady, assert, run });
}

function snapshotDescriptor(input: PropertyDescriptor): Readonly<PropertyDescriptor> {
  if ('value' in input) {
    return freeze({
      configurable: input.configurable,
      enumerable: input.enumerable,
      value: input.value,
      writable: input.writable,
    });
  }
  return freeze({
    configurable: input.configurable,
    enumerable: input.enumerable,
    get: input.get,
    set: input.set,
  });
}

function sameDescriptor(
  actual: PropertyDescriptor | undefined,
  expected: Readonly<PropertyDescriptor> | undefined,
): boolean {
  if (!actual || !expected) return actual === expected;
  if (
    actual.configurable !== expected.configurable ||
    actual.enumerable !== expected.enumerable
  ) {
    return false;
  }
  if ('value' in expected) {
    return 'value' in actual && objectIs(actual.value, expected.value) &&
      actual.writable === expected.writable;
  }
  return !('value' in actual) && actual.get === expected.get && actual.set === expected.set;
}
