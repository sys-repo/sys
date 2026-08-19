import { Fs, Is, StartGuiIntrinsic, type t } from './common.ts';
import { PiFs } from '../../u.fs.ts';

import { isCapturedSignalAborted } from './u.abort.ts';
import type { FailedMaterialization, StartGuiDependencies } from './u.deps.ts';
import { createOwnedError } from './u.error.ts';
import { isPromiseTransportReady, microtaskPromise, observePromiseTransport } from './u.promise.ts';
import { type ManifestSource, materializePolicy } from './u.source.ts';

type MaterializationEvidence = Readonly<{
  stage: FailedMaterialization['stage'];
  reason: FailedMaterialization['reason'];
  cleanup: FailedMaterialization['cleanup'];
  publication?: FailedMaterialization['publication'];
}>;

type MaterializationError = Error & {
  readonly materialization: MaterializationEvidence;
};

export type ReleaseLease = Readonly<{
  release(): Promise<void>;
}>;

type ReleaseOwner = Readonly<{
  storeDir: t.StringDir;
  lease: ReleaseLease;
}>;

type RootedOwner = Readonly<{
  path: t.StringAbsoluteDir;
  admit(
    targets: readonly t.FsRooted.TargetInput<'directory'>[],
    options?: t.FsRooted.OperationOptions,
  ): Promise<t.FsRooted.Admission<'directory'>>;
  acquireLease: t.FsRooted.Instance['acquireLease'];
}>;

type LeaseAcquisition =
  | Readonly<{ kind: 'acquired'; lease: ReleaseLease }>
  | Readonly<{ kind: 'not-acquired' }>
  | Readonly<{ kind: 'unresolved' }>;

type OperationSettlement<T> =
  | Readonly<{ kind: 'value'; value: T }>
  | Readonly<{ kind: 'failed' }>;

type OperationStart<T> =
  | Readonly<{ kind: 'observed'; promise: Promise<OperationSettlement<T>> }>
  | Readonly<{ kind: 'failed' }>
  | Readonly<{ kind: 'unobservable' }>;

const MATERIALIZATION_ERRORS = StartGuiIntrinsic.createWeakSet<object>();
const RETAINED_RELEASE_LEASES = StartGuiIntrinsic.createSet<ReleaseLease>();
const RETAINED_RELEASE_OPERATIONS = StartGuiIntrinsic.createSet<unknown>();
const apply = Reflect.apply;
const asyncDispose = Symbol.asyncDispose;
const defineProperty = Object.defineProperty;
const freeze = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;
const isFrozen = Object.isFrozen;
const isAbsolutePath = Fs.Path.Is.absolute;
const joinPath = Fs.join;
const resolvePath = Fs.resolve;
const objectPrototype = Object.prototype;
const arrayPrototype = Array.prototype;
const ownKeys = Reflect.ownKeys;
const RELEASE_STORE_SEGMENTS = freeze(
  [
    PiFs.sysDirSegments[0],
    PiFs.sysDirSegments[1],
    'dist',
  ] as const,
);
const RELEASE_OWNER_TARGET_PATH = PiFs.root as t.StringRelativePath;
const RELEASE_OWNER_TARGET_INPUT = freeze({
  path: RELEASE_OWNER_TARGET_PATH,
  kind: 'directory' as const,
});
const RELEASE_OWNER_TARGETS = freeze([RELEASE_OWNER_TARGET_INPUT]);
const OPERATION_FAILED: OperationSettlement<never> = freeze({ kind: 'failed' });
const START_FAILED: OperationStart<never> = freeze({ kind: 'failed' });
const START_UNOBSERVABLE: OperationStart<never> = freeze({ kind: 'unobservable' });
const LEASE_NOT_ACQUIRED: LeaseAcquisition = freeze({ kind: 'not-acquired' });
const LEASE_UNRESOLVED: LeaseAcquisition = freeze({ kind: 'unresolved' });

/** Acquire shared ownership before materialization can create or inspect the owner store. */
export async function prepareReleaseOwner(input: {
  root: t.StringDir;
  deps: StartGuiDependencies;
  until: AbortSignal;
}): Promise<ReleaseOwner> {
  const parent = apply(joinPath, undefined, [
    input.root,
    RELEASE_STORE_SEGMENTS[0],
    RELEASE_STORE_SEGMENTS[1],
    RELEASE_STORE_SEGMENTS[2],
  ]) as t.StringDir;
  const expectedRoot = snapshotCanonicalRoot(
    apply(resolvePath, undefined, [parent]),
  );
  if (!expectedRoot) throw storageFailure('not-needed');
  let acquiredLease: ReleaseLease | undefined;
  await microtaskPromise(() => undefined);
  try {
    assertActive(input.until);
    const ensuring = observeOperation(() =>
      apply(input.deps.ensureDir, undefined, [parent]) as Promise<void>
    );
    if (ensuring.kind === 'unobservable') throw storageFailure('pending');
    if (ensuring.kind === 'failed' || (await ensuring.promise).kind === 'failed') {
      throw storageFailure('not-needed');
    }

    assertActive(input.until);
    const creating = observeOperation(() =>
      apply(input.deps.createRooted, undefined, [{ root: parent, until: input.until }]) as Promise<
        t.FsRooted.Instance
      >
    );
    if (creating.kind === 'unobservable') throw storageFailure('pending');
    if (creating.kind === 'failed') throw storageFailure('not-needed');
    const created = await creating.promise;
    if (created.kind === 'failed') throw storageFailure('not-needed');
    const rooted = snapshotRootedOwner(created.value, expectedRoot);
    if (!rooted) throw storageFailure('not-needed');

    assertActive(input.until);
    const admitting = observeOperation(() =>
      rooted.admit(RELEASE_OWNER_TARGETS, { until: input.until })
    );
    if (admitting.kind === 'unobservable') throw storageFailure('pending');
    if (admitting.kind === 'failed') throw storageFailure('not-needed');
    const admitted = await admitting.promise;
    if (admitted.kind === 'failed') throw storageFailure('not-needed');

    assertActive(input.until);
    const target = snapshotAdmittedTarget(admitted.value);
    if (!target) throw storageFailure('not-needed');
    const storeDir = apply(joinPath, undefined, [rooted.path, target.path]) as t.StringDir;
    const acquiring = observeOperation(
      () =>
        rooted.acquireLease([target], {
          mode: 'shared',
          until: input.until,
        }),
      (result) => snapshotLeaseAcquisition(result, target),
    );
    if (acquiring.kind === 'unobservable') throw storageFailure('pending');
    if (acquiring.kind === 'failed') throw storageFailure('not-needed');
    const acquired = await acquiring.promise;
    if (acquired.kind === 'failed') throw storageFailure('not-needed');
    if (acquired.value.kind === 'unresolved') throw storageFailure('pending');
    if (acquired.value.kind === 'not-acquired') throw storageFailure('not-needed');

    acquiredLease = acquired.value.lease;
    assertActive(input.until);
    return freeze({ storeDir, lease: acquiredLease });
  } catch (cause) {
    if (!acquiredLease) {
      if (isMaterializationError(cause)) throw cause;
      throw storageFailure('not-needed');
    }

    const lease = acquiredLease;
    let cleanup: t.Dist.Cleanup = 'pending';
    const releasing = observeOperation(() => lease.release());
    if (releasing.kind === 'observed') {
      const released = await releasing.promise;
      if (released.kind === 'value') cleanup = 'complete';
    }
    if (cleanup === 'pending') StartGuiIntrinsic.setAdd(RETAINED_RELEASE_LEASES, lease);
    throw storageFailure(cleanup);
  }
}

/** Materialize one released generation while its owner lease remains held by the caller. */
export function materialize(input: {
  owner: ReleaseOwner;
  source: ManifestSource;
  integrity: t.StringHash;
  deps: StartGuiDependencies;
  until?: t.UntilInput;
}): Promise<unknown> {
  return apply(input.deps.materialize, undefined, [{
    manifestUrl: input.source.href,
    integrity: input.integrity,
    storeDir: input.owner.storeDir,
    policy: materializePolicy(input.source),
    until: input.until,
  }]) as Promise<unknown>;
}

/** Determine whether a failure carries package-owned materialization evidence. */
export function isMaterializationError(input: unknown): input is MaterializationError {
  return Is.object(input) && StartGuiIntrinsic.weakSetHas(MATERIALIZATION_ERRORS, input);
}

export function materializationError(result: FailedMaterialization): MaterializationError {
  const error = createOwnedError(
    `start:gui materialization failed: ${result.stage}/${result.reason}`,
  ) as MaterializationError;
  defineProperty(error, 'materialization', {
    configurable: false,
    enumerable: true,
    value: freeze({
      stage: result.stage,
      reason: result.reason,
      cleanup: result.cleanup,
      ...(result.publication === undefined ? {} : { publication: result.publication }),
    }),
  });
  StartGuiIntrinsic.weakSetAdd(MATERIALIZATION_ERRORS, error);
  return error;
}

function observeOperation<T>(invoke: () => Promise<T>): OperationStart<T>;
function observeOperation<T, R>(
  invoke: () => Promise<T>,
  fulfilled: (value: T) => R,
): OperationStart<R>;
function observeOperation<T, R = T>(
  invoke: () => Promise<T>,
  fulfilled?: (value: T) => R,
): OperationStart<R> {
  if (!isPromiseTransportReady()) return START_FAILED;
  let invoked = false;
  let transport: unknown;
  const invocationEvidence = freeze({ kind: 'invoked-without-transport' as const });
  try {
    invoked = true;
    transport = invoke();
    const observation = observePromiseTransport<T, OperationSettlement<R>>(transport, {
      fulfilled: (value) =>
        freeze({
          kind: 'value',
          value: fulfilled ? fulfilled(value) : value as unknown as R,
        }),
      rejected: () => OPERATION_FAILED,
    });
    if (observation.kind === 'observed') {
      return freeze({ kind: 'observed', promise: observation.promise });
    }
    StartGuiIntrinsic.setAdd(
      RETAINED_RELEASE_OPERATIONS,
      transport === undefined ? invocationEvidence : transport,
    );
    return START_UNOBSERVABLE;
  } catch {
    if (invoked) {
      StartGuiIntrinsic.setAdd(
        RETAINED_RELEASE_OPERATIONS,
        transport === undefined ? invocationEvidence : transport,
      );
      return START_UNOBSERVABLE;
    }
    return START_FAILED;
  }
}

function snapshotCanonicalRoot(input: unknown): t.StringAbsoluteDir | undefined {
  if (
    !Is.string(input) || input.length === 0 || input.length > 4_096 ||
    StartGuiIntrinsic.stringIncludes(input, '\0') ||
    !apply(isAbsolutePath, undefined, [input])
  ) return;
  return input as t.StringAbsoluteDir;
}

function snapshotRootedOwner(
  input: unknown,
  expectedRoot: t.StringAbsoluteDir,
): RootedOwner | undefined {
  if (!isFrozenDirectObject(input)) return;
  const path = ownData(input, 'path');
  const admit = ownData(input, 'admit');
  const acquireLease = ownData(input, 'acquireLease');
  if (
    !path.ok || path.value !== expectedRoot || !admit.ok || !Is.func(admit.value) ||
    Is.proxy(admit.value) || !acquireLease.ok || !Is.func(acquireLease.value) ||
    Is.proxy(acquireLease.value)
  ) return;

  const admitMethod = admit.value;
  const acquireLeaseMethod = acquireLease.value;
  return freeze({
    path: path.value as t.StringAbsoluteDir,
    admit(targets, options) {
      return apply(admitMethod, undefined, [targets, options]) as Promise<
        t.FsRooted.Admission<'directory'>
      >;
    },
    acquireLease(targets, options) {
      return apply(acquireLeaseMethod, undefined, [targets, options]) as Promise<
        t.FsRooted.LeaseResult
      >;
    },
  });
}

function snapshotAdmittedTarget(input: unknown): t.FsRooted.Target<'directory'> | undefined {
  if (!isFrozenDirectObject(input) || !hasExactDataShape(input, ['targets'])) return;
  const targets = ownData(input, 'targets');
  if (
    !targets.ok || !Is.array(targets.value) || Is.proxy(targets.value) ||
    getPrototypeOf(targets.value) !== arrayPrototype || !isFrozen(targets.value)
  ) return;
  if (targets.value.length !== 1 || !hasExactDataShape(targets.value, ['0', 'length'])) return;
  const targetProperty = ownData(targets.value, '0');
  if (!targetProperty.ok || !isFrozenDirectObject(targetProperty.value)) {
    return;
  }
  const target = targetProperty.value;
  if (!hasExactDataShape(target, ['kind', 'path'])) return;
  const kind = ownData(target, 'kind');
  const path = ownData(target, 'path');
  if (
    !kind.ok || kind.value !== 'directory' || !path.ok ||
    path.value !== RELEASE_OWNER_TARGET_PATH
  ) return;
  return target as t.FsRooted.Target<'directory'>;
}

function snapshotLeaseAcquisition(
  input: t.FsRooted.LeaseResult,
  expectedTarget: t.FsRooted.Target<'directory'>,
): LeaseAcquisition {
  if (!isFrozenDirectObject(input)) return retainUnresolvedAcquisition(input);
  const kind = ownData(input, 'kind');
  if (!kind.ok) return retainUnresolvedAcquisition(input);
  if (kind.value === 'busy') {
    const target = ownData(input, 'target');
    return hasExactDataShape(input, ['kind', 'target']) && target.ok &&
        target.value === expectedTarget
      ? LEASE_NOT_ACQUIRED
      : retainUnresolvedAcquisition(input);
  }
  if (kind.value !== 'acquired' || !hasExactDataShape(input, ['kind', 'lease'])) {
    return retainUnresolvedAcquisition(input);
  }

  const leaseProperty = ownData(input, 'lease');
  if (!leaseProperty.ok || !isFrozenDirectObject(leaseProperty.value)) {
    return retainUnresolvedAcquisition(input);
  }
  const leaseValue = leaseProperty.value;
  if (!hasExactDataShape(leaseValue, ['mode', 'targets', 'release', asyncDispose])) {
    return retainUnresolvedAcquisition(input);
  }
  const mode = ownData(leaseValue, 'mode');
  const targets = ownData(leaseValue, 'targets');
  const releaseProperty = ownData(leaseValue, 'release');
  const asyncDisposeProperty = ownData(leaseValue, asyncDispose);
  if (
    !mode.ok || mode.value !== 'shared' || !targets.ok || !Is.array(targets.value) ||
    Is.proxy(targets.value) || getPrototypeOf(targets.value) !== arrayPrototype ||
    !isFrozen(targets.value) || targets.value.length !== 1 ||
    !hasExactDataShape(targets.value, ['0', 'length']) || targets.value[0] !== expectedTarget ||
    !releaseProperty.ok || !Is.func(releaseProperty.value) || Is.proxy(releaseProperty.value) ||
    !asyncDisposeProperty.ok || !Is.func(asyncDisposeProperty.value) ||
    Is.proxy(asyncDisposeProperty.value)
  ) return retainUnresolvedAcquisition(input);

  const release = releaseProperty.value;
  const lease: ReleaseLease = freeze({
    release() {
      return apply(release, undefined, []) as Promise<void>;
    },
  });
  return freeze({ kind: 'acquired', lease });
}

function retainUnresolvedAcquisition(input: unknown): LeaseAcquisition {
  StartGuiIntrinsic.setAdd(RETAINED_RELEASE_OPERATIONS, input);
  return LEASE_UNRESOLVED;
}

function ownData(
  input: object,
  key: PropertyKey,
): Readonly<{ ok: true; value: unknown }> | Readonly<{ ok: false }> {
  try {
    const descriptor = getOwnPropertyDescriptor(input, key);
    return descriptor && 'value' in descriptor
      ? freeze({ ok: true as const, value: descriptor.value })
      : DATA_UNAVAILABLE;
  } catch {
    return DATA_UNAVAILABLE;
  }
}

function hasExactDataShape(input: object, keys: readonly (string | symbol)[]): boolean {
  try {
    const actual = ownKeys(input);
    if (actual.length !== keys.length) return false;
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      if (!StartGuiIntrinsic.arrayIncludes(actual, key) || !ownData(input, key).ok) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function isFrozenDirectObject(input: unknown): input is object {
  if (!Is.object(input) || Is.proxy(input)) return false;
  try {
    return getPrototypeOf(input) === objectPrototype && isFrozen(input);
  } catch {
    return false;
  }
}

function assertActive(signal: AbortSignal): void {
  if (isCapturedSignalAborted(signal)) {
    throw createOwnedError('Driver Pi Dist owner acquisition cancelled.');
  }
}

const DATA_UNAVAILABLE = freeze({ ok: false as const });

function storageFailure(cleanup: t.Dist.Cleanup): MaterializationError {
  return materializationError({
    kind: 'failed',
    stage: 'storage',
    reason: 'filesystem-failure',
    cleanup,
  });
}
