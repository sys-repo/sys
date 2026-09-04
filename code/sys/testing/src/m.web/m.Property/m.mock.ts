import { Is, type t } from './common.ts';

type CanonicalKey = string | symbol;
type CleanupErrorKind = t.WebFixture.Property.CleanupErrorKind;
type Phase = 'pending' | 'uncertain' | 'owned' | 'restored';

type CleanupErrorRecord<Kind extends CleanupErrorKind> = AggregateError & {
  readonly kind: Kind;
  readonly rollback: t.WebFixture.Property.Mock;
};

type EntryAuthority = {
  readonly source: t.WebFixture.Property.Entry;
  readonly target: object;
  readonly key: CanonicalKey;
};

type AdmittedEntry = {
  readonly target: object;
  readonly key: CanonicalKey;
  readonly replacement: PropertyDescriptor;
};

type Snapshot = AdmittedEntry & {
  readonly installed: PropertyDescriptor;
  readonly previous: PropertyDescriptor | undefined;
  phase: Phase;
};

const NativeAggregateError = AggregateError;
const NativeTypeError = TypeError;
const createObject = Object.create;
const defineProperty = Object.defineProperty;
const freezeObject = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const hasOwn = Object.hasOwn;
const isObject = Is.object;
const isSameValue = Object.is;
const deleteProperty = Reflect.deleteProperty;
const cleanupErrors = new WeakSet<object>();
const addCleanupError = cleanupErrors.add.bind(cleanupErrors);
const hasCleanupError = cleanupErrors.has.bind(cleanupErrors);
const disposeSymbol: typeof Symbol.dispose = Symbol.dispose;
const iteratorSymbol: typeof Symbol.iterator = Symbol.iterator;
const toKeyLabel = String;

/** Install one exact property-descriptor transaction until disposal. */
export function mock(
  entries: readonly t.WebFixture.Property.Entry[],
): t.WebFixture.Property.Mock {
  const length = entries.length;

  // Positional loops and intrinsic slot writes avoid caller-controlled Array.prototype dispatch.
  const authorities: EntryAuthority[] = [];
  for (let cursor = 0; cursor < length; cursor += 1) {
    setArrayValue(authorities, cursor, snapshotAuthority(entries[cursor]));
  }
  assertUnique(authorities);

  const admitted: AdmittedEntry[] = [];
  for (let cursor = 0; cursor < length; cursor += 1) {
    setArrayValue(admitted, cursor, admitEntry(authorities[cursor]));
  }

  const snapshots: Snapshot[] = [];
  for (let cursor = 0; cursor < length; cursor += 1) {
    const { target, key, replacement } = admitted[cursor];
    const previous = observeDescriptor(target, key);
    setArrayValue(snapshots, cursor, {
      target,
      key,
      replacement,
      previous,
      installed: preflightInstalled(key, previous, replacement),
      phase: 'pending',
    });
  }

  const handle = createMock(snapshots);
  try {
    for (let cursor = 0; cursor < length; cursor += 1) {
      const snapshot = snapshots[cursor];
      const { target, key, replacement } = snapshot;

      // Crossing a supplied mutation boundary makes cleanup mandatory until exact setup is observed.
      snapshot.phase = 'uncertain';
      defineProperty(target, key, replacement);
      assertInstalled(snapshot);
      snapshot.phase = 'owned';
    }
  } catch (setupFailure) {
    const rollbackFailures = restore(snapshots);
    if (rollbackFailures.length > 0) {
      throw setupError(setupFailure, rollbackFailures, handle);
    }
    throw setupFailure;
  }

  return handle;
}

/** Identify cleanup failures created by this Property owner. */
export function isCleanupError(value: unknown): value is t.WebFixture.Property.CleanupError {
  if (!isObject(value)) return false;
  try {
    return hasCleanupError(value);
  } catch {
    return false;
  }
}

/**
 * Helpers:
 */

/** Snapshot target and canonical property-key authority before evaluating descriptors. */
function snapshotAuthority(source: t.WebFixture.Property.Entry): EntryAuthority {
  const target = source.target;
  const key = toPropertyKey(source.key);
  return { source, target, key };
}

/** Canonicalize one declared `PropertyKey` before duplicate detection or target access. */
function toPropertyKey(key: PropertyKey): CanonicalKey {
  return typeof key === 'symbol' ? key : toKeyLabel(key);
}

/** Snapshot and validate one replacement descriptor before target mutation begins. */
function admitEntry({ source, target, key }: EntryAuthority): AdmittedEntry {
  const replacement = snapshotDescriptor(source.descriptor);
  return { target, key, replacement };
}

/**
 * Snapshot inherited or own descriptor fields in `ToPropertyDescriptor` order while preserving
 * omission semantics. Per-accessor probes preserve the required early failure boundary: an invalid
 * getter must throw before setter authority is read. The final probe rejects mixed descriptor
 * shapes only after every prescribed field read.
 */
function snapshotDescriptor(source: PropertyDescriptor): PropertyDescriptor {
  const snapshot = createObject(null) as PropertyDescriptor;
  if ('enumerable' in source) snapshot.enumerable = source.enumerable;
  if ('configurable' in source) snapshot.configurable = source.configurable;
  if ('value' in source) snapshot.value = source.value;
  if ('writable' in source) snapshot.writable = source.writable;
  if ('get' in source) {
    snapshot.get = source.get;
    const accessor = createObject(null) as PropertyDescriptor;
    accessor.get = snapshot.get;
    probeDescriptor(accessor);
  }
  if ('set' in source) {
    snapshot.set = source.set;
    const accessor = createObject(null) as PropertyDescriptor;
    accessor.set = snapshot.set;
    probeDescriptor(accessor);
  }

  probeDescriptor(snapshot);
  return snapshot;
}

/** Read one target descriptor into a prototype-independent internal record. */
function observeDescriptor(
  target: object,
  key: CanonicalKey,
): PropertyDescriptor | undefined {
  const observed = getOwnPropertyDescriptor(target, key);
  return observed === undefined ? undefined : snapshotOwnDescriptor(observed);
}

/** Copy only own fields from a runtime-produced descriptor. */
function snapshotOwnDescriptor(source: PropertyDescriptor): PropertyDescriptor {
  const snapshot = createObject(null) as PropertyDescriptor;
  if (hasOwn(source, 'configurable')) snapshot.configurable = source.configurable;
  if (hasOwn(source, 'enumerable')) snapshot.enumerable = source.enumerable;
  if (hasOwn(source, 'value')) snapshot.value = source.value;
  if (hasOwn(source, 'writable')) snapshot.writable = source.writable;
  if (hasOwn(source, 'get')) snapshot.get = source.get;
  if (hasOwn(source, 'set')) snapshot.set = source.set;
  return snapshot;
}

/** Force runtime descriptor validation without touching a supplied target. */
function probeDescriptor(descriptor: PropertyDescriptor): void {
  defineProperty(createObject(null), 'descriptor', descriptor);
}

/** Reject ambiguous ownership before descriptor evaluation or target mutation. */
function assertUnique(entries: EntryAuthority[]): void {
  // Positional scans avoid caller-controlled array iteration during admission.
  for (let cursor = 0; cursor < entries.length; cursor += 1) {
    const entry = entries[cursor];
    for (let priorCursor = 0; priorCursor < cursor; priorCursor += 1) {
      const candidate = entries[priorCursor];
      if (entry.target === candidate.target && entry.key === candidate.key) {
        throw new NativeTypeError(`Duplicate property fixture entry: ${toKeyLabel(entry.key)}`);
      }
    }
  }
}

/** Derive the complete installed descriptor and prove neutral ordinary-object restoration. */
function preflightInstalled(
  key: CanonicalKey,
  previous: PropertyDescriptor | undefined,
  replacement: PropertyDescriptor,
): PropertyDescriptor {
  const shadow = createObject(null);
  if (previous !== undefined) defineProperty(shadow, key, previous);
  defineProperty(shadow, key, replacement);

  const installed = observeDescriptor(shadow, key);
  if (installed === undefined) {
    throw new NativeTypeError(`Property fixture preflight did not install: ${toKeyLabel(key)}`);
  }

  try {
    if (previous !== undefined) {
      defineProperty(shadow, key, previous);
    } else if (!deleteProperty(shadow, key)) {
      throw new NativeTypeError(`Failed to restore absent property: ${toKeyLabel(key)}`);
    }
  } catch (cause) {
    throw new NativeTypeError(`Irreversible property fixture entry: ${toKeyLabel(key)}`, {
      cause,
    });
  }

  return installed;
}

/** Require a successful setup mutation to produce the exact neutral descriptor. */
function assertInstalled({ target, key, installed }: Snapshot): void {
  if (!descriptorsEqual(observeDescriptor(target, key), installed)) {
    throw new NativeTypeError(
      `Property fixture installation did not produce the expected descriptor: ${toKeyLabel(key)}`,
    );
  }
}

/** Create idempotent disposal authority that retries only unrestored entries. */
function createMock(snapshots: Snapshot[]): t.WebFixture.Property.Mock {
  let state: 'active' | 'disposing' | 'disposed' = 'active';
  const dispose = (_reason?: unknown): void => {
    if (state === 'disposed') return;
    if (state === 'disposing') {
      throw new NativeTypeError('Property fixture disposal is already in progress.');
    }

    state = 'disposing';
    try {
      const failures = restore(snapshots);
      if (failures.length > 0) throw restoreError(failures, handle);
      state = 'disposed';
    } finally {
      if (state === 'disposing') state = 'active';
    }
  };
  const handle: t.WebFixture.Property.Mock = { dispose, [disposeSymbol]: dispose };
  return handle;
}

/** Preserve retry authority when setup and its immediate rollback both fail. */
function setupError(
  setupFailure: unknown,
  rollbackFailures: unknown[],
  rollback: t.WebFixture.Property.Mock,
): t.WebFixture.Property.SetupError {
  const failures: unknown[] = [];
  setArrayValue(failures, 0, setupFailure);

  // Positional copying avoids caller-controlled array iteration during error construction.
  for (let cursor = 0; cursor < rollbackFailures.length; cursor += 1) {
    setArrayValue(failures, cursor + 1, rollbackFailures[cursor]);
  }

  return createCleanupError(
    'setup',
    failures,
    'Property fixture setup failed and rollback was incomplete.',
    rollback,
  );
}

/** Preserve retry authority for every incomplete disposal, including a single failure. */
function restoreError(
  failures: unknown[],
  rollback: t.WebFixture.Property.Mock,
): t.WebFixture.Property.RestoreError {
  return createCleanupError(
    'restore',
    failures,
    'Property fixture restoration was incomplete.',
    rollback,
  );
}

/** Construct and authenticate one cleanup error without exposing mutable constructor authority. */
function createCleanupError<Kind extends CleanupErrorKind>(
  kind: Kind,
  failures: unknown[],
  message: string,
  rollback: t.WebFixture.Property.Mock,
): CleanupErrorRecord<Kind> {
  const error = new NativeAggregateError(asStableIterable(failures), message);

  const errors = freezeObject(error.errors);
  defineFixedValue(error, 'errors', errors);
  defineFixedValue(error, 'kind', kind);
  defineFixedValue(error, 'rollback', rollback);
  addCleanupError(error);
  return error as CleanupErrorRecord<Kind>;
}

/** Restore live entries in reverse installation order without abandoning later cleanup. */
function restore(snapshots: Snapshot[]): unknown[] {
  const failures: unknown[] = [];

  // Positional control is intrinsic to reverse-order rollback.
  for (let cursor = snapshots.length - 1; cursor >= 0; cursor -= 1) {
    const snapshot = snapshots[cursor];
    if (snapshot.phase === 'pending' || snapshot.phase === 'restored') continue;

    try {
      restoreSnapshot(snapshot);
    } catch (error) {
      setArrayValue(failures, failures.length, error);
    }
  }
  return failures;
}

/** Restore one entry without trusting observation across an uncertain mutation boundary. */
function restoreSnapshot(snapshot: Snapshot): void {
  const { target, key, installed, previous } = snapshot;

  if (snapshot.phase === 'owned') {
    const current = observeDescriptor(target, key);
    if (descriptorsEqual(current, previous)) {
      snapshot.phase = 'restored';
      return;
    }
    if (!descriptorsEqual(current, installed)) {
      throw new NativeTypeError(
        `Property fixture ownership changed before restoration: ${toKeyLabel(key)}`,
      );
    }
  }

  // A thrown or unverifiable mutation remains uncertain until another mutation returns and its
  // exact postcondition is observed. Observation alone cannot release cleanup authority here.
  snapshot.phase = 'uncertain';
  if (previous !== undefined) {
    defineProperty(target, key, previous);
  } else if (!deleteProperty(target, key)) {
    throw new NativeTypeError(`Failed to restore absent property: ${toKeyLabel(key)}`);
  }

  if (!descriptorsEqual(observeDescriptor(target, key), previous)) {
    throw new NativeTypeError(
      `Property fixture restoration did not produce the prior descriptor: ${toKeyLabel(key)}`,
    );
  }
  snapshot.phase = 'restored';
}

/** Compare normalized own-property descriptors by ECMAScript SameValue semantics. */
function descriptorsEqual(
  current: PropertyDescriptor | undefined,
  previous: PropertyDescriptor | undefined,
): boolean {
  if (current === undefined || previous === undefined) return current === previous;
  return (
    current.configurable === previous.configurable &&
    current.enumerable === previous.enumerable &&
    current.writable === previous.writable &&
    isSameValue(current.value, previous.value) &&
    isSameValue(current.get, previous.get) &&
    isSameValue(current.set, previous.set)
  );
}

/** Define an internal array slot without inherited descriptor fields or prototype setters. */
function setArrayValue<T>(values: T[], index: number, value: T): void {
  const descriptor = createObject(null) as PropertyDescriptor;
  descriptor.configurable = true;
  descriptor.enumerable = true;
  descriptor.writable = true;
  descriptor.value = value;
  defineProperty(values, index, descriptor);
}

/** Define immutable cleanup metadata without inherited descriptor fields. */
function defineFixedValue(target: object, key: PropertyKey, value: unknown): void {
  const descriptor = createObject(null) as PropertyDescriptor;
  descriptor.configurable = false;
  descriptor.enumerable = false;
  descriptor.writable = false;
  descriptor.value = value;
  defineProperty(target, key, descriptor);
}

/** Hide internal arrays from ambient iterator mutation while constructing AggregateError. */
function asStableIterable(values: unknown[]): Iterable<unknown> {
  return {
    [iteratorSymbol]: () => {
      let cursor = 0;
      return {
        next: (): IteratorResult<unknown> => {
          if (cursor >= values.length) return { done: true, value: undefined };
          const value = values[cursor];
          cursor += 1;
          return { done: false, value };
        },
      };
    },
  };
}
