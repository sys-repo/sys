import { Hash, Is, StdPath, type t } from '../common.ts';
import { checkCancelled, failure, ioFailure, isFailure } from './u.error.ts';
import type { FileHandle, Io } from './u.io.ts';
import {
  ensureDescendantDirectory,
  type Identity,
  identityRequired,
  INTERNAL_NAME,
  lstatMaybe,
  observeTarget,
  revalidateRoot,
  type RootState,
  sameIdentity,
  type TargetState,
} from './u.path.ts';

const STAGES = 'stages';
const LOCKS = 'locks';
const OWNER = 'owner';
const CONTENT = 'content';
const LOCK_WAIT = 10 as t.Msecs;

export type StageState = {
  readonly handle: t.FsRooted.Stage;
  readonly container: string;
  readonly marker: string;
  readonly content: string;
  readonly token: string;
  readonly containerIdentity: Identity;
  readonly markerIdentity: Identity;
  readonly contentIdentity: Identity;
  status: 'active' | 'published' | 'discarded';
};

export async function createStage(
  io: Io,
  root: RootState,
  signal: AbortSignal,
  createChild: (root: string) => Promise<t.FsRooted.Instance>,
  stages: WeakMap<object, StageState>,
): Promise<t.FsRooted.Stage> {
  const operation = 'create-stage';
  await revalidateRoot(io, root, operation);
  const base = StdPath.join(root.path, INTERNAL_NAME, STAGES);
  await ensureDescendantDirectory(io, root, base, operation, signal);

  let container = '';
  for (let attempt = 0; attempt < 16; attempt++) {
    checkCancelled(operation, signal);
    container = StdPath.join(base, io.token());
    try {
      await io.mkdir(container, { mode: 0o700 });
      break;
    } catch (cause) {
      if (cause instanceof Deno.errors.AlreadyExists) {
        container = '';
        continue;
      }
      throw ioFailure(operation, cause);
    }
  }
  if (!container) throw failure(operation, 'io-failure');

  const containerInfo = await lstatMaybe(io, container, operation);
  if (!containerInfo?.isDirectory || containerInfo.isSymlink) {
    throw failure(operation, 'ownership-lost');
  }
  const containerIdentity = identityRequired(containerInfo, operation);
  const marker = StdPath.join(container, OWNER);
  const token = io.token();

  try {
    const markerIdentity = await writeMarker(io, marker, token, signal);
    checkCancelled(operation, signal);
    const content = StdPath.join(container, CONTENT);
    await io.mkdir(content, { mode: 0o700 });
    const contentInfo = await lstatMaybe(io, content, operation);
    if (!contentInfo?.isDirectory || contentInfo.isSymlink) {
      throw failure(operation, 'ownership-lost');
    }
    const contentIdentity = identityRequired(contentInfo, operation);
    checkCancelled(operation, signal);
    const files = await createChild(content);
    checkCancelled(operation, signal);
    const handle = Object.freeze({ path: files.path, files }) as t.FsRooted.Stage;
    const state: StageState = {
      handle,
      container,
      marker,
      content,
      token,
      containerIdentity,
      markerIdentity,
      contentIdentity,
      status: 'active',
    };
    stages.set(handle, state);
    return handle;
  } catch (cause) {
    let pending = cause;
    try {
      await removeContainer(io, container, containerIdentity, operation);
    } catch (cleanupCause) {
      pending = cleanupCause;
    }
    if (isFailure(pending)) throw pending;
    throw ioFailure(operation, pending);
  }
}

export async function discardStage(
  io: Io,
  stages: WeakMap<object, StageState>,
  stage: t.FsRooted.Stage,
): Promise<void> {
  const operation = 'discard-stage';
  const state = stageState(stages, stage, operation);
  if (state.status === 'discarded') return;
  if (state.status === 'published') {
    await cleanupPublished(io, state, operation);
    return;
  }
  await validateActive(io, state, operation);
  await removeContainer(io, state.container, state.containerIdentity, operation);
  state.status = 'discarded';
}

export async function promoteStage(
  io: Io,
  root: RootState,
  stages: WeakMap<object, StageState>,
  stage: t.FsRooted.Stage,
  target: TargetState<'directory'>,
  signal: AbortSignal,
): Promise<t.FsRooted.PromotionResult> {
  const operation = 'promote-stage';
  const state = stageState(stages, stage, operation);
  if (state.status !== 'active') throw failure(operation, 'invalid-state');

  let lock: FileHandle | undefined;
  let locked = false;
  let outcome: 'published' | 'occupied' | undefined;
  let cleanupError: t.FsRooted.Failure | undefined;
  let pending: unknown;

  try {
    lock = await acquireLock(io, root, target, signal);
    locked = true;
    await validateActive(io, state, operation);
    checkCancelled(operation, signal);

    const existing = await observeTarget(io, root, target, operation, signal, true);
    if (existing) {
      outcome = 'occupied';
      try {
        await discardActive(io, state, operation);
      } catch (cause) {
        cleanupError = toFailure(operation, cause, false);
      }
    } else {
      checkCancelled(operation, signal);
      try {
        await io.rename(state.content, target.absolute);
      } catch (cause) {
        if (cause instanceof Deno.errors.AlreadyExists) {
          const raced = await observeTarget(io, root, target, operation, signal, false);
          if (raced?.isDirectory && !raced.isSymlink) {
            outcome = 'occupied';
            try {
              await discardActive(io, state, operation);
            } catch (cleanupCause) {
              cleanupError = toFailure(operation, cleanupCause, false);
            }
          } else {
            throw failure(operation, 'unsafe-filesystem', { cause });
          }
        } else {
          throw ioFailure(operation, cause);
        }
      }

      if (!outcome) {
        // The target becomes visible when the stage directory is renamed into place.
        outcome = 'published';
        state.status = 'published';
        try {
          const published = await lstatMaybe(io, target.absolute, operation);
          if (
            !published?.isDirectory ||
            published.isSymlink ||
            !sameIdentity(state.contentIdentity, published)
          ) {
            throw failure(operation, 'unsafe-filesystem', { committed: true });
          }
          await cleanupPublished(io, state, operation);
          if (signal.aborted) {
            cleanupError = failure(operation, 'cancelled', {
              cause: signal.reason,
              committed: true,
            });
          }
        } catch (cause) {
          cleanupError = toFailure(operation, cause, true);
        }
      }
    }
  } catch (cause) {
    pending = cause;
    if (state.status === 'active') {
      try {
        await discardActive(io, state, operation);
      } catch (cleanupCause) {
        pending = cleanupCause;
      }
    }
  } finally {
    if (lock) {
      if (locked) {
        try {
          await lock.unlock();
        } catch (cause) {
          if (outcome) cleanupError ??= toFailure(operation, cause, outcome === 'published');
          else pending ??= cause;
        }
      }
      try {
        lock.close();
      } catch (cause) {
        if (outcome) cleanupError ??= toFailure(operation, cause, outcome === 'published');
        else pending ??= cause;
      }
    }
  }

  if (pending) throw toFailure(operation, pending, false);
  if (!outcome) throw failure(operation, 'io-failure');
  return cleanupError
    ? Object.freeze({ kind: outcome, cleanupError })
    : Object.freeze({ kind: outcome });
}

function stageState(
  stages: WeakMap<object, StageState>,
  stage: t.FsRooted.Stage,
  operation: t.FsRooted.Operation,
): StageState {
  const state = Is.object(stage) ? stages.get(stage) : undefined;
  if (!state) throw failure(operation, 'foreign-handle');
  return state;
}

async function acquireLock(
  io: Io,
  root: RootState,
  target: TargetState<'directory'>,
  signal: AbortSignal,
): Promise<FileHandle> {
  const operation = 'promote-stage';
  await revalidateRoot(io, root, operation);
  const lockPath = StdPath.join(root.path, INTERNAL_NAME, LOCKS, toLockName(target.path));
  await ensureDescendantDirectory(io, root, StdPath.dirname(lockPath), operation, signal);

  const before = await lstatMaybe(io, lockPath, operation);
  if (before && (before.isSymlink || !before.isFile)) {
    throw failure(operation, 'unsafe-filesystem');
  }

  // Keep the lock file: deleting it while held would let another writer lock a different file.
  let file: FileHandle;
  try {
    file = await io.open(lockPath, { read: true, write: true, create: true, mode: 0o600 });
  } catch (cause) {
    throw ioFailure(operation, cause);
  }

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
        acquired = await file.tryLock(true);
      } catch (cause) {
        throw ioFailure(operation, cause);
      }
      if (acquired) {
        const current = await lstatMaybe(io, lockPath, operation);
        if (
          !current?.isFile ||
          current.isSymlink ||
          !sameIdentity(identity, current)
        ) {
          throw failure(operation, 'unsafe-filesystem');
        }
        return file;
      }
      try {
        await io.wait(LOCK_WAIT, signal);
      } catch (cause) {
        if (signal.aborted) throw failure(operation, 'cancelled', { cause });
        throw ioFailure(operation, cause);
      }
    }
  } catch (cause) {
    file.close();
    throw cause;
  }
}

/** Derive one private lock name for common case and Unicode-normalization variants. */
export function toLockName(path: string): string {
  const key = path.normalize('NFC').toLowerCase().normalize('NFC');
  return `${Hash.sha256(key)}.lock`;
}

async function validateActive(
  io: Io,
  state: StageState,
  operation: t.FsRooted.Operation,
): Promise<void> {
  if (state.status !== 'active') throw failure(operation, 'invalid-state');
  const container = await lstatMaybe(io, state.container, operation);
  const content = await lstatMaybe(io, state.content, operation);
  if (
    !container?.isDirectory ||
    container.isSymlink ||
    !content?.isDirectory ||
    content.isSymlink ||
    !sameIdentity(state.containerIdentity, container) ||
    !sameIdentity(state.contentIdentity, content)
  ) {
    throw failure(operation, 'ownership-lost');
  }
  await readMarker(io, state, operation);
}

async function writeMarker(
  io: Io,
  path: string,
  token: string,
  signal: AbortSignal,
): Promise<Identity> {
  const operation = 'create-stage';
  const bytes = new TextEncoder().encode(token);
  const file = await io.open(path, { read: true, write: true, createNew: true, mode: 0o600 });
  let identity: Identity | undefined;
  try {
    const opened = await file.stat();
    identity = identityRequired(opened, operation);
    let offset = 0;
    while (offset < bytes.byteLength) {
      checkCancelled(operation, signal);
      const written = await file.write(bytes.subarray(offset));
      if (!Is.number(written) || written <= 0 || written > bytes.byteLength - offset) {
        throw failure(operation, 'io-failure');
      }
      offset += written;
    }
    await file.sync();
    const final = await file.stat();
    if (final.size !== bytes.byteLength || !sameIdentity(identity, final)) {
      throw failure(operation, 'ownership-lost');
    }
    return identity;
  } finally {
    file.close();
  }
}

async function readMarker(
  io: Io,
  state: StageState,
  operation: t.FsRooted.Operation,
): Promise<void> {
  const pathInfo = await lstatMaybe(io, state.marker, operation);
  if (!pathInfo?.isFile || pathInfo.isSymlink || !sameIdentity(state.markerIdentity, pathInfo)) {
    throw failure(operation, 'ownership-lost');
  }

  const file = await io.open(state.marker, { read: true });
  try {
    const opened = await file.stat();
    if (!sameIdentity(state.markerIdentity, opened)) throw failure(operation, 'ownership-lost');
    const expected = new TextEncoder().encode(state.token);
    const buffer = new Uint8Array(expected.byteLength + 1);
    let offset = 0;
    while (offset < buffer.byteLength) {
      const read = await file.read(buffer.subarray(offset));
      if (read === null) break;
      if (!Is.number(read) || read <= 0) throw failure(operation, 'ownership-lost');
      offset += read;
    }
    if (offset !== expected.byteLength) throw failure(operation, 'ownership-lost');
    for (let index = 0; index < expected.byteLength; index++) {
      if (buffer[index] !== expected[index]) throw failure(operation, 'ownership-lost');
    }
  } finally {
    file.close();
  }
}

async function discardActive(
  io: Io,
  state: StageState,
  operation: t.FsRooted.Operation,
): Promise<void> {
  await validateActive(io, state, operation);
  await removeContainer(io, state.container, state.containerIdentity, operation);
  state.status = 'discarded';
}

async function cleanupPublished(
  io: Io,
  state: StageState,
  operation: t.FsRooted.Operation,
): Promise<void> {
  const container = await lstatMaybe(io, state.container, operation);
  if (!container) return;
  const content = await lstatMaybe(io, state.content, operation);
  if (!container.isDirectory || container.isSymlink || content) {
    throw failure(operation, 'ownership-lost', { committed: true });
  }
  if (!sameIdentity(state.containerIdentity, container)) {
    throw failure(operation, 'ownership-lost', { committed: true });
  }
  try {
    await readMarker(io, state, operation);
  } catch (cause) {
    throw toFailure(operation, cause, true);
  }
  await removeContainer(io, state.container, state.containerIdentity, operation, true);
}

async function removeContainer(
  io: Io,
  path: string,
  identity: Identity,
  operation: t.FsRooted.Operation,
  committed = false,
): Promise<void> {
  const info = await lstatMaybe(io, path, operation);
  if (!info) return;
  if (!info.isDirectory || info.isSymlink || !sameIdentity(identity, info)) {
    throw failure(operation, 'ownership-lost', { committed });
  }
  try {
    await io.remove(path, { recursive: true });
  } catch (cause) {
    throw ioFailure(operation, cause, committed);
  }
}

function toFailure(
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
