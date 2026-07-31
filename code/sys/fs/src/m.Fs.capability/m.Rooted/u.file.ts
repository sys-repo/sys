import { Is, StdPath, type t } from './common.ts';
import { checkCancelled, failure, ioFailure, isFailure } from './u.error.ts';
import type { FileHandle, Io } from './u.io.ts';
import {
  type Identity,
  identityRequired,
  lstatMaybe,
  observeTarget,
  revalidateRoot,
  type RootState,
  sameIdentity,
  type TargetState,
  TEMP_PREFIX,
} from './u.path.ts';

export async function publishFile(
  io: Io,
  root: RootState,
  target: TargetState<'file'>,
  bytes: Uint8Array,
  signal: AbortSignal,
): Promise<t.FsRooted.FileResult> {
  const operation = 'publish-file';
  if (!Is.uint8Array(bytes)) throw failure(operation, 'invalid-target');
  // Snapshot mutable caller bytes before the first await.
  const content = bytes.slice();

  let temp: { readonly path: string; readonly identity: Identity } | undefined;
  let committed = false;

  try {
    const existing = await observeTarget(io, root, target, operation, signal, true);
    if (existing) throw failure(operation, 'occupied');

    temp = await writeTemp(io, target.absolute, content, signal);
    await revalidateRoot(io, root, operation);
    const beforeLink = await observeTarget(io, root, target, operation, signal, false);
    if (beforeLink) throw failure(operation, 'occupied');
    await assertOwnedFile(io, temp.path, temp.identity, operation);
    checkCancelled(operation, signal);

    try {
      await io.link(temp.path, target.absolute);
    } catch (cause) {
      if (cause instanceof Deno.errors.AlreadyExists) {
        const raced = await lstatMaybe(io, target.absolute, operation);
        if (!raced?.isFile || raced.isSymlink) {
          throw failure(operation, 'unsafe-filesystem', { cause });
        }
        throw failure(operation, 'occupied', { cause });
      }
      throw ioFailure(operation, cause);
    }
    // The target becomes visible when the hard link is created.
    committed = true;

    const tempInfo = await lstatMaybe(io, temp.path, operation);
    const targetInfo = await lstatMaybe(io, target.absolute, operation);
    if (
      !tempInfo ||
      !targetInfo ||
      !tempInfo.isFile ||
      !targetInfo.isFile ||
      !sameIdentity(temp.identity, tempInfo) ||
      !sameIdentity(temp.identity, targetInfo) ||
      targetInfo.size !== content.byteLength
    ) {
      throw failure(operation, 'unsafe-filesystem', { committed: true });
    }

    await removeOwnedFile(io, temp.path, temp.identity, operation, true);
    temp = undefined;
    checkCancelled(operation, signal, true);
    return Object.freeze({
      kind: 'published',
      bytes: content.byteLength as t.NumberBytes,
    });
  } catch (cause) {
    let cleanupCause: unknown;
    if (temp) {
      try {
        await removeOwnedFile(io, temp.path, temp.identity, operation, committed);
      } catch (error) {
        cleanupCause = error;
      }
    }
    if (cleanupCause) throw committedFailure(operation, cleanupCause, committed);
    throw committedFailure(operation, cause, committed);
  }
}

async function writeTemp(
  io: Io,
  target: string,
  bytes: Uint8Array,
  signal: AbortSignal,
): Promise<{ readonly path: string; readonly identity: Identity }> {
  const operation = 'publish-file';
  const parent = StdPath.dirname(target);
  let path = '';
  let file: FileHandle | undefined;

  for (let attempt = 0; attempt < 16; attempt++) {
    checkCancelled(operation, signal);
    path = StdPath.join(parent, `${TEMP_PREFIX}${io.token()}`);
    try {
      file = await io.open(path, { read: true, write: true, createNew: true, mode: 0o600 });
      break;
    } catch (cause) {
      if (cause instanceof Deno.errors.AlreadyExists) continue;
      throw ioFailure(operation, cause);
    }
  }
  if (!file) throw failure(operation, 'io-failure');

  let identity: Identity | undefined;
  let cause: unknown;
  try {
    const opened = await file.stat();
    if (!opened.isFile) throw failure(operation, 'unsafe-filesystem');
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
    checkCancelled(operation, signal);
    const info = await file.stat();
    if (!info.isFile || info.size !== bytes.byteLength || !sameIdentity(identity, info)) {
      throw failure(operation, 'unsafe-filesystem');
    }
  } catch (error) {
    cause = error;
  } finally {
    try {
      file.close();
    } catch (error) {
      cause ??= error;
    }
  }

  if (cause || !identity) {
    if (identity) {
      try {
        await removeOwnedFile(io, path, identity, operation, false);
      } catch (cleanupCause) {
        throw committedFailure(operation, cleanupCause, false);
      }
    }
    throw committedFailure(operation, cause ?? failure(operation, 'io-failure'), false);
  }
  return { path, identity };
}

export async function removeOwnedFile(
  io: Io,
  path: string,
  identity: Identity,
  operation: t.FsRooted.Operation,
  committed: boolean,
): Promise<void> {
  const info = await lstatMaybe(io, path, operation);
  if (!info) return;
  if (!info.isFile || info.isSymlink || !sameIdentity(identity, info)) {
    throw failure(operation, 'ownership-lost', { committed });
  }
  try {
    await io.remove(path);
  } catch (cause) {
    throw ioFailure(operation, cause, committed);
  }
}

async function assertOwnedFile(
  io: Io,
  path: string,
  identity: Identity,
  operation: t.FsRooted.Operation,
): Promise<void> {
  const info = await lstatMaybe(io, path, operation);
  if (!info || !info.isFile || info.isSymlink || !sameIdentity(identity, info)) {
    throw failure(operation, 'ownership-lost');
  }
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
