import { Is, Num, StdPath, type t } from '../common.ts';
import { checkCancelled, failure, ioFailure, isFailure } from './u.error.ts';
import type { Io } from './u.io.ts';
import {
  assertLeaseBorrow,
  borrowLease,
  hasLocalLease,
  type LeaseBorrow,
  type LeaseRegistry,
  type LeaseState,
  releaseLeaseBorrow,
} from './u.lease.ts';
import { acquireLock, type LockState, releaseLock } from './u.lock.ts';
import {
  type Identity,
  identityRequired,
  lstatMaybe,
  observeTarget,
  type RootState,
  sameIdentity,
  type TargetState,
} from './u.path.ts';
import { type StageState, stageTreeAuthority, validateActive } from './u.stage.ts';
import {
  inspectTreeSeal,
  removeTreeEntries,
  sealTreeEntries,
  type TreeAuthority,
} from './u.tree.ts';

type OwnedTreeState =
  | { readonly kind: 'stage'; readonly state: StageState }
  | { readonly kind: 'target'; readonly state: TargetState<'directory'> };

export type OwnedTreeInput = {
  readonly lease?: t.FsRooted.Lease;
  readonly until?: t.UntilInput;
};

export type RemoveTreeInput = {
  readonly lease: t.FsRooted.Lease;
  readonly until?: t.UntilInput;
};

/** Snapshot exact sealing-operation lifecycle input. */
export function ownedTreeInput(
  options: t.FsRooted.OwnedTreeOptions | undefined,
  operation: 'inspect-seal' | 'seal-tree',
): OwnedTreeInput {
  try {
    if (options === undefined) return Object.freeze({});
    if (!Is.plainObject(options)) throw failure(operation, 'invalid-options');
    const keys = Reflect.ownKeys(options);
    if (keys.some((key) => key !== 'until' && key !== 'lease')) {
      throw failure(operation, 'invalid-options');
    }
    const untilProperty = Reflect.getOwnPropertyDescriptor(options, 'until');
    const leaseProperty = Reflect.getOwnPropertyDescriptor(options, 'lease');
    if (
      (untilProperty && !('value' in untilProperty)) ||
      (leaseProperty && !('value' in leaseProperty))
    ) {
      throw failure(operation, 'invalid-options');
    }
    const until = untilProperty?.value;
    const lease = leaseProperty?.value;
    if (!Is.untilInput(until)) throw failure(operation, 'invalid-options');
    if (!(lease === undefined || Is.object(lease))) throw failure(operation, 'invalid-lease');
    return Object.freeze({ until, lease: lease as t.FsRooted.Lease | undefined });
  } catch (cause) {
    if (isFailure(cause)) throw cause;
    throw failure(operation, 'invalid-options');
  }
}

/** Snapshot hostile removal options before entering the operation lifecycle. */
export function removeTreeInput(options: t.FsRooted.RemoveTreeOptions): RemoveTreeInput {
  const operation = 'remove-tree';
  try {
    if (!Is.plainObject(options)) throw failure(operation, 'invalid-options');
    const keys = Reflect.ownKeys(options);
    if (keys.some((key) => key !== 'lease' && key !== 'until')) {
      throw failure(operation, 'invalid-options');
    }
    const leaseProperty = Reflect.getOwnPropertyDescriptor(options, 'lease');
    const untilProperty = Reflect.getOwnPropertyDescriptor(options, 'until');
    if (
      (leaseProperty && !('value' in leaseProperty)) ||
      (untilProperty && !('value' in untilProperty))
    ) {
      throw failure(operation, 'invalid-options');
    }
    if (!leaseProperty || !Is.object(leaseProperty.value)) {
      throw failure(operation, 'invalid-lease');
    }
    const until = untilProperty?.value;
    if (!Is.untilInput(until)) throw failure(operation, 'invalid-options');
    return Object.freeze({ lease: leaseProperty.value as t.FsRooted.Lease, until });
  } catch (cause) {
    if (isFailure(cause)) throw cause;
    throw failure(operation, 'invalid-options');
  }
}

export async function inspectOwnedSeal(
  io: Io,
  root: RootState,
  targets: WeakMap<object, TargetState>,
  stages: WeakMap<object, StageState>,
  leases: WeakMap<object, LeaseState>,
  registry: LeaseRegistry,
  tree: t.FsRooted.OwnedTree,
  input: OwnedTreeInput,
  signal: AbortSignal,
): Promise<t.FsRooted.SealInspection> {
  const operation = 'inspect-seal';
  const state = ownedTreeState(targets, stages, tree, operation);
  if (state.kind === 'stage') {
    if (input.lease) throw failure(operation, 'invalid-lease');
    await validateActive(io, state.state, operation);
    return await inspectTreeSeal(
      io,
      stageTreeAuthority(io, state.state, operation),
      operation,
      signal,
    );
  }

  return await withTargetOwnership(
    io,
    root,
    leases,
    registry,
    state.state,
    input.lease,
    operation,
    'shared',
    signal,
    async () => {
      const authority = await targetTreeAuthority(
        io,
        root,
        state.state,
        operation,
        signal,
      );
      return await inspectTreeSeal(io, authority, operation, signal);
    },
    () => false,
  );
}

export async function sealOwnedTree(
  io: Io,
  root: RootState,
  targets: WeakMap<object, TargetState>,
  stages: WeakMap<object, StageState>,
  leases: WeakMap<object, LeaseState>,
  registry: LeaseRegistry,
  tree: t.FsRooted.OwnedTree,
  input: OwnedTreeInput,
  signal: AbortSignal,
): Promise<t.FsRooted.SealResult> {
  const operation = 'seal-tree';
  const state = ownedTreeState(targets, stages, tree, operation);
  if (state.kind === 'stage') {
    if (input.lease) throw failure(operation, 'invalid-lease');
    await validateActive(io, state.state, operation);
    return await sealTreeEntries(
      io,
      stageTreeAuthority(io, state.state, operation),
      operation,
      signal,
    );
  }

  return await withTargetOwnership(
    io,
    root,
    leases,
    registry,
    state.state,
    input.lease,
    operation,
    'exclusive',
    signal,
    async () => {
      const authority = await targetTreeAuthority(
        io,
        root,
        state.state,
        operation,
        signal,
      );
      return await sealTreeEntries(io, authority, operation, signal);
    },
    (result) => result.kind === 'applied' && result.changed,
  );
}

export async function removeOwnedTree(
  io: Io,
  root: RootState,
  targets: WeakMap<object, TargetState>,
  leases: WeakMap<object, LeaseState>,
  handle: t.FsRooted.Target<'directory'>,
  input: RemoveTreeInput,
  signal: AbortSignal,
): Promise<t.FsRooted.RemoveTreeResult> {
  const operation = 'remove-tree';
  const target = targetState(targets, handle, operation);
  const borrow = borrowLease(leases, input.lease, target, 'exclusive', operation);
  const validateLease = () => assertLeaseBorrow(borrow, operation);

  try {
    const observed = await observeTarget(io, root, target, operation, signal, false);
    if (!observed) {
      validateLease();
      checkCancelled(operation, signal);
      return Object.freeze({ kind: 'absent' });
    }
    const identity = identityRequired(observed, operation);
    validateLease();
    if (Deno.build.os !== 'windows') {
      const parent = await lstatMaybe(io, StdPath.dirname(target.absolute), operation);
      if (!parent?.isDirectory || parent.isSymlink) {
        throw failure(operation, 'ownership-lost');
      }
      if (!Num.Is.safeInt(parent.mode) || parent.mode < 0) {
        throw failure(operation, 'unsupported');
      }
      const mode = parent.mode & 0o777;
      const removable = (mode & 0o300) === 0o300 ||
        (mode & 0o030) === 0o030 ||
        (mode & 0o003) === 0o003;
      if (!removable) throw failure(operation, 'permission-denied');
    }
    validateLease();
    const authority = targetAuthority(
      io,
      root,
      target,
      identity,
      operation,
      signal,
      validateLease,
    );
    await removeTreeEntries(io, authority, operation, signal);
    try {
      validateLease();
      const remaining = await observeTarget(io, root, target, operation, signal, false);
      if (remaining) throw failure(operation, 'ownership-lost', { committed: true });
      validateLease();
      checkCancelled(operation, signal, true);
    } catch (cause) {
      if (isFailure(cause)) {
        throw failure(operation, cause.kind, { cause, committed: true });
      }
      throw ioFailure(operation, cause, true);
    }
    return Object.freeze({ kind: 'removed' });
  } finally {
    releaseLeaseBorrow(borrow);
  }
}

function ownedTreeState(
  targets: WeakMap<object, TargetState>,
  stages: WeakMap<object, StageState>,
  input: t.FsRooted.OwnedTree,
  operation: t.FsRooted.Operation,
): OwnedTreeState {
  if (!Is.object(input)) throw failure(operation, 'foreign-handle');
  const stage = stages.get(input);
  if (stage) return { kind: 'stage', state: stage };
  const target = targets.get(input);
  if (!target) throw failure(operation, 'foreign-handle');
  if (target.kind !== 'directory') throw failure(operation, 'invalid-target');
  return { kind: 'target', state: target as TargetState<'directory'> };
}

function targetState(
  targets: WeakMap<object, TargetState>,
  handle: t.FsRooted.Target<'directory'>,
  operation: t.FsRooted.Operation,
): TargetState<'directory'> {
  const target = Is.object(handle) ? targets.get(handle) : undefined;
  if (!target) throw failure(operation, 'foreign-handle');
  if (target.kind !== 'directory') throw failure(operation, 'invalid-target');
  return target as TargetState<'directory'>;
}

async function targetTreeAuthority(
  io: Io,
  root: RootState,
  target: TargetState<'directory'>,
  operation: t.FsRooted.Operation,
  signal: AbortSignal,
): Promise<TreeAuthority> {
  const observed = await observeTarget(io, root, target, operation, signal, false);
  if (!observed) throw failure(operation, 'missing');
  const identity = identityRequired(observed, operation);
  return targetAuthority(io, root, target, identity, operation, signal);
}

function targetAuthority(
  io: Io,
  root: RootState,
  target: TargetState<'directory'>,
  identity: Identity,
  operation: t.FsRooted.Operation,
  signal: AbortSignal,
  beforeValidate?: () => void,
): TreeAuthority {
  return {
    path: target.absolute,
    identity,
    validate: async (committed) => {
      beforeValidate?.();
      const current = await observeTarget(io, root, target, operation, signal, false);
      if (!current?.isDirectory || current.isSymlink || !sameIdentity(identity, current)) {
        throw failure(operation, 'ownership-lost', { committed });
      }
    },
  };
}

async function withTargetOwnership<T>(
  io: Io,
  root: RootState,
  leases: WeakMap<object, LeaseState>,
  registry: LeaseRegistry,
  target: TargetState<'directory'>,
  lease: t.FsRooted.Lease | undefined,
  operation: t.FsRooted.Operation,
  mode: t.FsRooted.LeaseMode,
  signal: AbortSignal,
  fn: () => Promise<T>,
  committed: (result: T) => boolean,
): Promise<T> {
  let borrow: LeaseBorrow | undefined;
  let lock: LockState | undefined;
  let result: T | undefined;
  let pending: unknown;
  try {
    if (lease) {
      borrow = borrowLease(leases, lease, target, mode, operation);
    } else {
      if (hasLocalLease(registry, target)) throw failure(operation, 'invalid-lease');
      lock = await acquireLock(io, root, target, { operation, mode, wait: true, signal });
      if (!lock) throw failure(operation, 'io-failure');
    }
    result = await fn();
  } catch (cause) {
    pending = cause;
  } finally {
    if (lock) {
      try {
        await releaseLock(io, root, lock, operation);
      } catch (cause) {
        pending ??= result === undefined
          ? cause
          : committedFailure(operation, cause, committed(result));
      }
    }
    if (borrow) releaseLeaseBorrow(borrow);
  }
  if (pending) throw pending;
  if (result === undefined) throw failure(operation, 'io-failure');
  return result;
}

function committedFailure(
  operation: t.FsRooted.Operation,
  cause: unknown,
  committed: boolean,
): t.FsRooted.Failure {
  if (isFailure(cause)) {
    if (!committed || cause.committed) return cause;
    return failure(operation, cause.kind, { cause, committed: true });
  }
  return ioFailure(operation, cause, committed);
}
