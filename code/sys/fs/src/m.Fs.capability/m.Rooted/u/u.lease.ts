import { Is, Str, type t } from '../common.ts';
import { checkCancelled, failure, ioFailure, isFailure } from './u.error.ts';
import type { Io } from './u.io.ts';
import { acquireLock, type LockState, releaseLock, toLockName } from './u.lock.ts';
import { observeTarget, type RootState, type TargetState } from './u.path.ts';

const compare = Str.Compare.codeUnit();

type LeaseTarget = {
  readonly handle: t.FsRooted.Target<'directory'>;
  readonly state: TargetState<'directory'>;
  readonly lockName: string;
};

export type LeaseState = {
  readonly mode: t.FsRooted.LeaseMode;
  readonly targets: readonly TargetState<'directory'>[];
  readonly drained: Set<() => void>;
  borrowers: number;
  status: 'active' | 'releasing' | 'released';
};

export type LeaseRegistry = Map<string, Set<LeaseState>>;

export type LeaseBorrow = {
  readonly state: LeaseState;
  readonly target: TargetState<'directory'>;
  active: boolean;
};

type LeaseInput = {
  readonly mode: t.FsRooted.LeaseMode;
  readonly targets: readonly t.FsRooted.Target<'directory'>[];
  readonly ordered: readonly LeaseTarget[];
  readonly until?: t.UntilInput;
};

/** Snapshot and validate a complete lease batch before acquisition begins. */
export function leaseInput(
  handles: readonly t.FsRooted.Target<'directory'>[],
  options: t.FsRooted.LeaseOptions,
  resolve: (handle: t.FsRooted.Target<'directory'>) => TargetState<'directory'>,
): LeaseInput {
  const operation = 'acquire-lease';
  try {
    if (!Is.array(handles) || handles.length === 0 || !Is.plainObject(options)) {
      throw failure(operation, 'invalid-lease');
    }
    const keys = Reflect.ownKeys(options);
    if (keys.some((key) => key !== 'mode' && key !== 'until')) {
      throw failure(operation, 'invalid-lease');
    }
    const modeProperty = Reflect.getOwnPropertyDescriptor(options, 'mode');
    const untilProperty = Reflect.getOwnPropertyDescriptor(options, 'until');
    if (
      !modeProperty ||
      !('value' in modeProperty) ||
      (untilProperty && !('value' in untilProperty))
    ) {
      throw failure(operation, 'invalid-lease');
    }
    const mode = modeProperty.value;
    const until = untilProperty?.value;
    if (!(mode === 'shared' || mode === 'exclusive') || !Is.untilInput(until)) {
      throw failure(operation, 'invalid-lease');
    }

    const targets = Object.freeze([...handles]);
    const ordered = targets.map((handle) => {
      const state = resolve(handle);
      return Object.freeze({ handle, state, lockName: toLockName(state.path) });
    }).sort((a, b) => compare(a.lockName, b.lockName));

    for (let index = 1; index < ordered.length; index++) {
      if (ordered[index - 1].lockName === ordered[index].lockName) {
        throw failure(operation, 'target-collision');
      }
    }

    return Object.freeze({
      mode,
      targets,
      ordered: Object.freeze(ordered),
      until,
    });
  } catch (cause) {
    if (isFailure(cause)) throw cause;
    throw failure(operation, 'invalid-lease');
  }
}

/** Try to acquire one complete lease batch without retaining a partial result. */
export async function acquireLease(
  io: Io,
  root: RootState,
  input: LeaseInput,
  signal: AbortSignal,
  leases: WeakMap<object, LeaseState>,
  registry: LeaseRegistry,
): Promise<t.FsRooted.LeaseResult> {
  const operation = 'acquire-lease';
  const locks: LockState[] = [];

  try {
    for (const target of input.ordered) {
      checkCancelled(operation, signal);
      const lock = await acquireLock(io, root, target.state, {
        operation,
        mode: input.mode,
        wait: false,
        signal,
      });
      if (!lock) {
        const held = locks.splice(0);
        await releaseAll(io, root, held, operation);
        return Object.freeze({ kind: 'busy', target: target.handle });
      }
      locks.push(lock);
      await observeTarget(io, root, target.state, operation, signal, false);
    }
    checkCancelled(operation, signal);
  } catch (cause) {
    const held = locks.splice(0);
    try {
      await releaseAll(io, root, held, operation);
    } catch (cleanupCause) {
      throw asFailure(operation, cleanupCause);
    }
    throw asFailure(operation, cause);
  }

  const state: LeaseState = {
    mode: input.mode,
    targets: Object.freeze(input.ordered.map((target) => target.state)),
    drained: new Set(),
    borrowers: 0,
    status: 'active',
  };
  registerLease(registry, state);
  let release: Promise<void> | undefined;
  const releaseOnce = () => {
    if (!release) {
      state.status = 'releasing';
      release = (async () => {
        await waitForBorrows(state);
        try {
          await releaseAll(io, root, locks, 'release-lease');
        } finally {
          state.status = 'released';
          unregisterLease(registry, state);
        }
      })();
    }
    return release;
  };
  const lease: t.FsRooted.Lease = Object.freeze({
    mode: input.mode,
    targets: input.targets,
    release: releaseOnce,
    [Symbol.asyncDispose]: releaseOnce,
  });
  leases.set(lease, state);
  return Object.freeze({ kind: 'acquired', lease });
}

/** Pin compatible lease ownership until one operation has settled. */
export function borrowLease(
  leases: WeakMap<object, LeaseState>,
  lease: t.FsRooted.Lease,
  target: TargetState<'directory'>,
  mode: t.FsRooted.LeaseMode,
  operation: t.FsRooted.Operation,
): LeaseBorrow {
  const state = Is.object(lease) ? leases.get(lease) : undefined;
  const compatible = mode === 'shared'
    ? state?.mode === 'shared' || state?.mode === 'exclusive'
    : state?.mode === 'exclusive';
  if (
    !state ||
    state.status !== 'active' ||
    !compatible ||
    !state.targets.includes(target)
  ) {
    throw failure(operation, 'invalid-lease');
  }
  state.borrowers += 1;
  return { state, target, active: true };
}

/** Keep validating a borrow while release waits for that operation to settle. */
export function assertLeaseBorrow(
  borrow: LeaseBorrow,
  operation: t.FsRooted.Operation,
): void {
  if (
    !borrow.active ||
    borrow.state.status === 'released' ||
    !borrow.state.targets.includes(borrow.target)
  ) {
    throw failure(operation, 'invalid-lease');
  }
}

/** End one operation borrow and unblock a pending lease release when it was the last. */
export function releaseLeaseBorrow(borrow: LeaseBorrow): void {
  if (!borrow.active) return;
  borrow.active = false;
  borrow.state.borrowers -= 1;
  if (borrow.state.borrowers !== 0) return;
  for (const resolve of borrow.state.drained) resolve();
  borrow.state.drained.clear();
}

/** Return true while this Rooted instance already owns the target lock through any lease. */
export function hasLocalLease(
  registry: LeaseRegistry,
  target: TargetState<'directory'>,
): boolean {
  const states = registry.get(toLockName(target.path));
  if (!states) return false;
  for (const state of states) {
    if (state.status !== 'released') return true;
  }
  return false;
}

async function waitForBorrows(state: LeaseState): Promise<void> {
  if (state.borrowers === 0) return;
  await new Promise<void>((resolve) => state.drained.add(resolve));
}

function registerLease(registry: LeaseRegistry, state: LeaseState): void {
  for (const target of state.targets) {
    const key = toLockName(target.path);
    const states = registry.get(key) ?? new Set<LeaseState>();
    states.add(state);
    registry.set(key, states);
  }
}

function unregisterLease(registry: LeaseRegistry, state: LeaseState): void {
  for (const target of state.targets) {
    const key = toLockName(target.path);
    const states = registry.get(key);
    if (!states) continue;
    states.delete(state);
    if (states.size === 0) registry.delete(key);
  }
}

async function releaseAll(
  io: Io,
  root: RootState,
  locks: readonly LockState[],
  operation: 'acquire-lease' | 'release-lease',
): Promise<void> {
  let pending: t.FsRooted.Failure | undefined;
  for (let index = locks.length - 1; index >= 0; index--) {
    try {
      await releaseLock(io, root, locks[index], operation);
    } catch (cause) {
      pending ??= asFailure(operation, cause);
    }
  }
  if (pending) throw pending;
}

function asFailure(
  operation: t.FsRooted.Operation,
  cause: unknown,
): t.FsRooted.Failure {
  return isFailure(cause) ? cause : ioFailure(operation, cause);
}
