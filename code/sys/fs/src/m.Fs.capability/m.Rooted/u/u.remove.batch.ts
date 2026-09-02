import { Is as ServerIs } from '@sys/std/is/server';

import { Is, Num, Obj, Rx, type t } from '../common.ts';
import { checkCancelled, failure, ioFailure, isFailure } from './u.error.ts';

const operation = 'remove-tree-batch' as const;
const arrayPrototype = Array.prototype;
const freeze = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;
const objectPrototype = Object.prototype;
const ownKeys = Reflect.ownKeys;
const INVALID_UNTIL = Symbol('invalid-until');

export type BatchOwner = {
  readonly admit: t.FsRooted.Instance['Target']['admit'];
  readonly acquire: t.FsRooted.Instance['Lease']['acquire'];
  readonly remove: t.FsRooted.Instance['Tree']['remove'];
};

export type RemoveTreeBatchInput = {
  readonly targets: readonly t.StringPath[];
  readonly until?: t.UntilInput;
};

/** Snapshot the complete caller path batch and lifecycle authority before asynchronous work. */
export function removeTreeBatchInput(
  targets: readonly t.StringPath[],
  options?: t.FsRooted.OperationOptions,
): RemoveTreeBatchInput {
  const snapshot = snapshotTargets(targets);
  const until = snapshotOptions(options);
  return Object.freeze({ targets: snapshot, until });
}

/** Compose existing Rooted primitives into one leased caller-order removal transaction. */
export async function removeTreeBatch(
  owner: BatchOwner,
  input: RemoveTreeBatchInput,
): Promise<t.FsRooted.RemoveTreeBatchResult> {
  const initial = unattempted(input.targets);
  if (initial.length === 0) return settled([]);

  let life: t.Abortable;
  try {
    life = Rx.abortable(input.until);
  } catch (cause) {
    return failed(
      [],
      undefined,
      initial,
      failure(operation, 'io-failure', { cause }),
    );
  }

  try {
    // Let abortable latch synchronous upstream emissions before any filesystem boundary.
    await Promise.resolve();
    return await runBatch(owner, input.targets, initial, life.signal);
  } finally {
    life.dispose();
  }
}

async function runBatch(
  owner: BatchOwner,
  paths: readonly t.StringPath[],
  initial: readonly t.FsRooted.RemoveTreeBatchUnattempted[],
  signal: AbortSignal,
): Promise<t.FsRooted.RemoveTreeBatchResult> {
  let targets: readonly t.FsRooted.Target<'directory'>[];
  try {
    checkCancelled(operation, signal);
    const admission = await owner.admit(
      paths.map((path) => freeze({ kind: 'directory' as const, path })),
      operationOptions(signal),
    );
    checkCancelled(operation, signal);
    targets = admission.targets;
  } catch (cause) {
    return failed([], undefined, initial, asFailure(cause, 'admit'));
  }

  let acquired: t.FsRooted.LeaseResult;
  try {
    acquired = await owner.acquire(
      targets,
      freeze({ mode: 'exclusive', wait: false, until: signal }),
    );
  } catch (cause) {
    return failed([], undefined, initial, asFailure(cause, 'acquire-lease'));
  }

  if (acquired.kind === 'busy') {
    try {
      checkCancelled(operation, signal);
    } catch (cause) {
      return failed([], undefined, initial, asFailure(cause, operation));
    }
    const index = targets.indexOf(acquired.target);
    if (index < 0) {
      return failed(
        [],
        undefined,
        initial,
        failure(operation, 'invalid-state'),
      );
    }
    return freeze({
      kind: 'busy',
      index,
      path: targets[index].path,
    });
  }

  const completed: t.FsRooted.RemoveTreeBatchItem[] = [];
  let primary: t.FsRooted.Failure | undefined;
  let current: t.FsRooted.RemoveTreeBatchTarget | undefined;
  try {
    checkCancelled(operation, signal);
  } catch (cause) {
    primary = asFailure(cause, operation);
  }

  if (!primary) {
    for (const [index, target] of targets.entries()) {
      try {
        checkCancelled('remove-tree', signal);
        const result = await owner.remove(
          target,
          freeze({ lease: acquired.lease, until: signal }),
        );
        completed.push(freeze({ index, path: target.path, kind: result.kind }));
      } catch (cause) {
        primary = asFailure(cause, 'remove-tree');
        current = freeze({ index, path: target.path });
        break;
      }
    }
  }

  let releaseError: t.FsRooted.Failure | undefined;
  try {
    await acquired.lease.release();
  } catch (cause) {
    releaseError = asFailure(cause, 'release-lease');
  }

  if (primary) {
    return failed(
      completed,
      current,
      current ? unattempted(paths.slice(current.index + 1), current.index + 1) : initial,
      primary,
      releaseError,
    );
  }
  return settled(completed, releaseError);
}

function snapshotTargets(input: unknown): readonly t.StringPath[] {
  try {
    if (
      !Is.array(input) || ServerIs.Native.proxy(input) ||
      Object.getPrototypeOf(input) !== arrayPrototype
    ) {
      throw failure(operation, 'invalid-target');
    }
    const lengthProperty = Reflect.getOwnPropertyDescriptor(input, 'length');
    const length = lengthProperty && 'value' in lengthProperty ? lengthProperty.value : undefined;
    if (!Num.Is.safeInt(length) || length < 0) throw failure(operation, 'invalid-target');

    const keys = Reflect.ownKeys(input);
    if (keys.length !== length + 1) throw failure(operation, 'invalid-target');
    const targets: t.StringPath[] = [];
    for (let index = 0; index < length; index += 1) {
      const property = Reflect.getOwnPropertyDescriptor(input, String(index));
      if (!property || !('value' in property) || property.enumerable !== true) {
        throw failure(operation, 'invalid-target');
      }
      if (!Is.str(property.value)) throw failure(operation, 'invalid-target');
      targets.push(property.value);
    }
    return Object.freeze(targets);
  } catch (cause) {
    if (isFailure(cause)) throw cause;
    throw failure(operation, 'invalid-target', { cause });
  }
}

function snapshotOptions(input: unknown): t.UntilInput | undefined {
  try {
    if (input === undefined) return;
    if (ServerIs.Native.proxy(input) || !Is.object(input)) {
      throw failure(operation, 'invalid-options');
    }
    if (getPrototypeOf(input) !== objectPrototype) {
      throw failure(operation, 'invalid-options');
    }

    const keys = ownKeys(input);
    if (keys.some((key) => key !== 'until')) throw failure(operation, 'invalid-options');
    const property = getOwnPropertyDescriptor(input, 'until');
    if (property && !Obj.hasOwn(property, 'value')) {
      throw failure(operation, 'invalid-options');
    }
    const until = snapshotUntilInput(property?.value);
    if (!until) throw failure(operation, 'invalid-options');
    return until.value;
  } catch (cause) {
    if (isFailure(cause)) throw cause;
    throw failure(operation, 'invalid-options', { cause });
  }
}

function snapshotUntilInput(
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

function operationOptions(until: t.UntilInput): t.FsRooted.OperationOptions {
  return freeze({ until });
}

function unattempted(
  paths: readonly t.StringPath[],
  offset = 0,
): readonly t.FsRooted.RemoveTreeBatchUnattempted[] {
  return Object.freeze(
    paths.map((path, index) => Object.freeze({ index: offset + index, path })),
  );
}

function settled(
  results: readonly t.FsRooted.RemoveTreeBatchItem[],
  releaseError?: t.FsRooted.Failure,
): t.FsRooted.RemoveTreeBatchSettled {
  return Object.freeze({
    kind: 'settled',
    results: Object.freeze(results),
    ...(releaseError ? { releaseError } : {}),
  });
}

function failed(
  completed: readonly t.FsRooted.RemoveTreeBatchItem[],
  current: t.FsRooted.RemoveTreeBatchTarget | undefined,
  pending: readonly t.FsRooted.RemoveTreeBatchUnattempted[],
  primary: t.FsRooted.Failure,
  releaseError?: t.FsRooted.Failure,
): t.FsRooted.RemoveTreeBatchFailed {
  return Object.freeze({
    kind: 'failed',
    completed: Object.freeze(completed),
    ...(current ? { current } : {}),
    unattempted: Object.freeze(pending),
    failure: primary,
    ...(releaseError ? { releaseError } : {}),
    changed: completed.some((result) => result.kind === 'removed') || primary.committed,
  });
}

function asFailure(
  cause: unknown,
  fallbackOperation: t.FsRooted.Operation,
): t.FsRooted.Failure {
  return isFailure(cause) ? cause : ioFailure(fallbackOperation, cause);
}
