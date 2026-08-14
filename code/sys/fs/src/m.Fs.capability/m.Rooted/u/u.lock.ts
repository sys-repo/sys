import { Hash, Is, StdPath, type t } from '../common.ts';
import { checkCancelled, failure, ioFailure, isFailure } from './u.error.ts';
import type { FileHandle, Io } from './u.io.ts';
import {
  ensureDescendantDirectory,
  type Identity,
  identityRequired,
  INTERNAL_NAME,
  lstatMaybe,
  revalidateRoot,
  type RootState,
  sameIdentity,
  type TargetState,
} from './u.path.ts';

const LOCKS = 'locks';
const LOCK_WAIT = 10 as t.Msecs;

export type LockState = {
  readonly file: FileHandle;
  readonly path: t.StringAbsolutePath;
  readonly identity: Identity;
};

/**
 * Acquire the stable Rooted-owned lock for one admitted directory target.
 *
 * The lock file lives under Rooted metadata, not beneath the deletable target. It is never removed:
 * replacing a path while another process holds the old inode would split cooperative ownership.
 * `wait: false` reports ordinary contention as `undefined`; every other failure is typed.
 */
export async function acquireLock(
  io: Io,
  root: RootState,
  target: TargetState<'directory'>,
  options: {
    readonly operation: t.FsRooted.Operation;
    readonly mode: t.FsRooted.LeaseMode;
    readonly wait: boolean;
    readonly signal: AbortSignal;
  },
): Promise<LockState | undefined> {
  const { operation, mode, signal, wait } = options;
  await revalidateRoot(io, root, operation);
  const lockPath = StdPath.join(
    root.path,
    INTERNAL_NAME,
    LOCKS,
    toLockName(target.path),
  ) as t.StringAbsolutePath;
  await ensureDescendantDirectory(io, root, StdPath.dirname(lockPath), operation, signal);

  const before = await lstatMaybe(io, lockPath, operation);
  if (before && (before.isSymlink || !before.isFile)) {
    throw failure(operation, 'unsafe-filesystem');
  }

  let file: FileHandle;
  try {
    file = await io.open(lockPath, { read: true, write: true, create: true, mode: 0o600 });
  } catch (cause) {
    throw ioFailure(operation, cause);
  }

  let held = false;
  try {
    const opened = await file.stat();
    const identity = identityRequired(opened, operation);
    const after = await lstatMaybe(io, lockPath, operation);
    if (!opened.isFile || !after?.isFile || after.isSymlink || !sameIdentity(identity, after)) {
      throw failure(operation, 'unsafe-filesystem');
    }

    while (true) {
      checkCancelled(operation, signal);
      let acquired: boolean;
      try {
        acquired = await file.tryLock(mode === 'exclusive');
      } catch (cause) {
        throw ioFailure(operation, cause);
      }

      if (!Is.bool(acquired)) throw failure(operation, 'io-failure');
      if (acquired) {
        held = true;
        await revalidateRoot(io, root, operation);
        const current = await lstatMaybe(io, lockPath, operation);
        if (!current?.isFile || current.isSymlink || !sameIdentity(identity, current)) {
          throw failure(operation, 'unsafe-filesystem');
        }
        checkCancelled(operation, signal);
        return Object.freeze({ file, path: lockPath, identity });
      }

      checkCancelled(operation, signal);
      if (!wait) {
        closeUnlocked(file, operation);
        return undefined;
      }
      try {
        await io.wait(LOCK_WAIT, signal);
      } catch (cause) {
        if (signal.aborted) throw failure(operation, 'cancelled', { cause });
        throw ioFailure(operation, cause);
      }
    }
  } catch (cause) {
    throw await closeAfterFailure(file, held, operation, cause);
  }
}

/** Release one held lock while preserving path-identity failure evidence. */
export async function releaseLock(
  io: Io,
  root: RootState,
  lock: LockState,
  operation: t.FsRooted.Operation,
): Promise<void> {
  let pending: t.FsRooted.Failure | undefined;

  try {
    await revalidateRoot(io, root, operation);
    const current = await lstatMaybe(io, lock.path, operation);
    if (
      !current?.isFile ||
      current.isSymlink ||
      !sameIdentity(lock.identity, current)
    ) {
      throw failure(operation, 'ownership-lost');
    }
  } catch (cause) {
    pending = asFailure(operation, cause);
  }

  try {
    await lock.file.unlock();
  } catch (cause) {
    pending ??= ioFailure(operation, cause);
  }

  try {
    lock.file.close();
  } catch (cause) {
    pending ??= ioFailure(operation, cause);
  }

  if (pending) throw pending;
}

/** Derive one private lock name for common case and Unicode-normalization variants. */
export function toLockName(path: string): string {
  const key = path.normalize('NFC').toLowerCase().normalize('NFC');
  return `${Hash.sha256(key)}.lock`;
}

function closeUnlocked(file: FileHandle, operation: t.FsRooted.Operation): void {
  try {
    file.close();
  } catch (cause) {
    throw ioFailure(operation, cause);
  }
}

async function closeAfterFailure(
  file: FileHandle,
  held: boolean,
  operation: t.FsRooted.Operation,
  cause: unknown,
): Promise<t.FsRooted.Failure> {
  let pending = asFailure(operation, cause);
  if (held) {
    try {
      await file.unlock();
    } catch (cleanupCause) {
      pending = ioFailure(operation, cleanupCause);
    }
  }
  try {
    file.close();
  } catch (cleanupCause) {
    pending = ioFailure(operation, cleanupCause);
  }
  return pending;
}

function asFailure(
  operation: t.FsRooted.Operation,
  cause: unknown,
): t.FsRooted.Failure {
  return isFailure(cause) ? cause : ioFailure(operation, cause);
}
