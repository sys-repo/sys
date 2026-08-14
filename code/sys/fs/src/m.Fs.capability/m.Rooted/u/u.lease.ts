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

  let release: Promise<void> | undefined;
  const releaseOnce = () => {
    return release ??= releaseAll(io, root, locks, 'release-lease');
  };
  const lease: t.FsRooted.Lease = Object.freeze({
    mode: input.mode,
    targets: input.targets,
    release: releaseOnce,
    [Symbol.asyncDispose]: releaseOnce,
  });
  return Object.freeze({ kind: 'acquired', lease });
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
