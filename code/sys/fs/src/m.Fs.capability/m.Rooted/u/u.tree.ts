import { Is, Num, StdPath, Str, type t } from '../common.ts';
import { checkCancelled, failure, ioFailure, isFailure } from './u.error.ts';
import type { Io, ModeHandle, ModeInfo } from './u.io.ts';
import { type Identity, identityRequired, lstatMaybe, sameIdentity } from './u.path.ts';

const compare = Str.Compare.codeUnit();
const WRITE_BITS = 0o222;
const OWNER_READ = 0o400;
const OWNER_DIRECTORY_ACCESS = 0o500;
const OWNER_DIRECTORY_CONTENT_REMOVAL = 0o300;

export type TreeAuthority = {
  readonly path: string;
  readonly identity: Identity;
  readonly validate: (committed: boolean) => Promise<void>;
};

export type ModeEntry = {
  readonly path: string;
  readonly kind: 'file' | 'directory';
  readonly identity: Identity;
};

type TreeEntry = ModeEntry & {
  readonly relative: string;
  readonly mode?: number;
};

/** Inspect one stable owned-tree snapshot without granting raw metadata authority. */
export async function inspectTreeSeal(
  io: Io,
  tree: TreeAuthority,
  operation: t.FsRooted.Operation,
  signal: AbortSignal,
): Promise<t.FsRooted.SealInspection> {
  let entries: readonly TreeEntry[];
  try {
    entries = await stableSnapshot(io, tree, operation, signal, false);
  } catch (cause) {
    if (isFailure(cause) && cause.kind === 'unsupported' && !cause.committed) {
      return Object.freeze({ kind: 'unsupported' });
    }
    throw cause;
  }
  if (entries.some((entry) => entry.mode === undefined)) {
    return Object.freeze({ kind: 'unsupported' });
  }
  const kind = entries.every((entry) => isSealed(entry, entry.mode as number))
    ? 'sealed'
    : 'unsealed';
  return Object.freeze({ kind });
}

/** Apply and verify the portable Rooted sealing contract over one complete owned tree. */
export async function sealTreeEntries(
  io: Io,
  tree: TreeAuthority,
  operation: t.FsRooted.Operation,
  signal: AbortSignal,
): Promise<t.FsRooted.SealResult> {
  let entries: readonly TreeEntry[];
  try {
    entries = await stableSnapshot(io, tree, operation, signal, false);
  } catch (cause) {
    if (isFailure(cause) && cause.kind === 'unsupported' && !cause.committed) {
      return Object.freeze({ kind: 'unsupported' });
    }
    throw cause;
  }
  if (entries.some((entry) => entry.mode === undefined)) {
    return Object.freeze({ kind: 'unsupported' });
  }

  let committed = false;
  for (const entry of entries) {
    checkCancelled(operation, signal, committed);
    await validateAuthority(tree, operation, committed);
    const current = await assertEntry(io, entry, operation, committed);
    const mode = modeOf(current);
    if (mode === undefined) {
      if (!committed) return Object.freeze({ kind: 'unsupported' });
      throw failure(operation, 'unsupported', { committed: true });
    }

    const desired = sealedMode(entry.kind, mode);
    if ((mode & 0o7777) === desired) continue;

    try {
      committed = await changeEntryMode(
        io,
        entry,
        mode,
        desired,
        operation,
        committed,
      ) || committed;
    } catch (cause) {
      const error = toFailure(operation, cause, committed);
      if (error.kind === 'unsupported' && !error.committed) {
        return Object.freeze({ kind: 'unsupported' });
      }
      throw error;
    }
  }

  checkCancelled(operation, signal, committed);
  await validateAuthority(tree, operation, committed);
  const final = await stableSnapshot(io, tree, operation, signal, committed);
  if (!sameTopology(entries, final)) {
    throw failure(operation, 'ownership-lost', { committed });
  }
  if (final.some((entry) => entry.mode === undefined)) {
    throw failure(operation, 'unsupported', { committed });
  }
  if (!final.every((entry) => isSealed(entry, entry.mode as number))) {
    throw failure(operation, 'unsupported', { committed });
  }
  checkCancelled(operation, signal, committed);
  return Object.freeze({ kind: 'applied', changed: committed });
}

/** Restore only entry-local removal permissions, then delete one identity-bound tree post-order. */
export async function removeTreeEntries(
  io: Io,
  tree: TreeAuthority,
  operation: t.FsRooted.Operation,
  signal: AbortSignal,
  initiallyCommitted = false,
): Promise<void> {
  const entries = await stableSnapshot(
    io,
    tree,
    operation,
    signal,
    initiallyCommitted,
  );
  let committed = initiallyCommitted;
  const contentParents = new Set(entries.map((entry) => StdPath.dirname(entry.path)));

  for (const entry of [...entries].reverse()) {
    if (entry.kind !== 'directory' || !contentParents.has(entry.path)) continue;
    checkCancelled(operation, signal, committed);
    await validateAuthority(tree, operation, committed);
    const current = await assertEntry(io, entry, operation, committed);
    const mode = modeOf(current);
    if (
      mode === undefined ||
      (mode & OWNER_DIRECTORY_CONTENT_REMOVAL) === OWNER_DIRECTORY_CONTENT_REMOVAL
    ) {
      continue;
    }

    await restorePermissions(
      io,
      entry,
      mode,
      OWNER_DIRECTORY_CONTENT_REMOVAL,
      operation,
      committed,
    );
    committed = true;
  }

  for (const entry of entries) {
    checkCancelled(operation, signal, committed);
    await validateAuthority(tree, operation, committed);
    await assertEntry(io, entry, operation, committed);

    let removed = false;
    let removalCause: unknown;
    try {
      await io.remove(entry.path);
      removed = true;
    } catch (cause) {
      removalCause = cause;
    }

    if (!removed) {
      let remaining: Deno.FileInfo | undefined;
      try {
        remaining = await lstatMaybe(io, entry.path, operation);
      } catch (reconciliationCause) {
        throw ioFailure(
          operation,
          new AggregateError(
            [removalCause, reconciliationCause],
            'Removal and filesystem reconciliation both failed.',
          ),
          true,
        );
      }
      if (removalCause instanceof Deno.errors.NotFound) {
        throw failure(operation, 'ownership-lost', {
          cause: removalCause,
          committed: committed || !remaining,
        });
      }
      if (!remaining) throw toFailure(operation, removalCause, true);
      if (removalCause instanceof Deno.errors.PermissionDenied) {
        throw failure(operation, 'permission-denied', {
          cause: removalCause,
          committed,
        });
      }
      throw toFailure(operation, removalCause, committed);
    }
    committed = true;

    let remaining: Deno.FileInfo | undefined;
    try {
      remaining = await lstatMaybe(io, entry.path, operation);
    } catch (cause) {
      throw toFailure(operation, cause, true);
    }
    if (remaining) throw failure(operation, 'ownership-lost', { committed: true });
    checkCancelled(operation, signal, true);
  }
}

async function stableSnapshot(
  io: Io,
  tree: TreeAuthority,
  operation: t.FsRooted.Operation,
  signal: AbortSignal,
  committed: boolean,
): Promise<readonly TreeEntry[]> {
  const first = await snapshot(io, tree, operation, signal, committed);
  const second = await snapshot(io, tree, operation, signal, committed);
  if (!sameSnapshot(first, second)) {
    throw failure(operation, 'ownership-lost', { committed });
  }
  return first;
}

async function snapshot(
  io: Io,
  tree: TreeAuthority,
  operation: t.FsRooted.Operation,
  signal: AbortSignal,
  committed: boolean,
): Promise<readonly TreeEntry[]> {
  checkCancelled(operation, signal, committed);
  await validateAuthority(tree, operation, committed);
  const entries: TreeEntry[] = [];
  const seen = new Set<string>();
  const directories = new Set<string>();
  await visit(
    io,
    tree.path,
    '',
    'directory',
    tree.identity,
    tree.identity.dev,
    entries,
    seen,
    directories,
    operation,
    signal,
    committed,
  );
  await validateAuthority(tree, operation, committed);
  checkCancelled(operation, signal, committed);
  return Object.freeze(entries);
}

async function visit(
  io: Io,
  path: string,
  relative: string,
  kind: TreeEntry['kind'],
  identity: Identity,
  device: number,
  entries: TreeEntry[],
  seen: Set<string>,
  directories: Set<string>,
  operation: t.FsRooted.Operation,
  signal: AbortSignal,
  committed: boolean,
): Promise<void> {
  checkCancelled(operation, signal, committed);
  if (seen.has(path)) throw failure(operation, 'unsafe-filesystem', { committed });
  seen.add(path);

  const expected: TreeEntry = { path, relative, kind, identity };
  const info = await assertEntry(io, expected, operation, committed);
  const observedIdentity = identityRequired(info, operation, committed);
  if (observedIdentity.dev !== device) {
    throw failure(operation, 'unsafe-filesystem', { committed });
  }

  if (kind === 'directory') {
    const directoryIdentity = `${observedIdentity.dev}:${observedIdentity.ino}`;
    if (directories.has(directoryIdentity)) {
      throw failure(operation, 'unsafe-filesystem', { committed });
    }
    directories.add(directoryIdentity);
    const children: Deno.DirEntry[] = [];
    try {
      for await (const child of io.readDir(path)) {
        checkCancelled(operation, signal, committed);
        children.push(child);
      }
    } catch (cause) {
      throw toFailure(operation, cause, committed);
    }
    children.sort((a, b) => compare(a.name, b.name));
    await assertEntry(io, expected, operation, committed);

    for (const child of children) {
      checkCancelled(operation, signal, committed);
      if (!validName(child.name)) {
        throw failure(operation, 'unsafe-filesystem', { committed });
      }
      const childPath = StdPath.join(path, child.name);
      const childRelative = relative ? `${relative}/${child.name}` : child.name;
      const childInfo = await lstatMaybe(io, childPath, operation);
      if (!childInfo) throw failure(operation, 'ownership-lost', { committed });
      if (childInfo.isSymlink) {
        throw failure(operation, 'unsafe-filesystem', { committed });
      }
      const childKind = childInfo.isDirectory ? 'directory' : childInfo.isFile ? 'file' : undefined;
      if (!childKind) throw failure(operation, 'unsafe-filesystem', { committed });
      const childIdentity = identityRequired(childInfo, operation, committed);
      if (childIdentity.dev !== device) {
        throw failure(operation, 'unsafe-filesystem', { committed });
      }
      await visit(
        io,
        childPath,
        childRelative,
        childKind,
        childIdentity,
        device,
        entries,
        seen,
        directories,
        operation,
        signal,
        committed,
      );
    }
  }

  const final = await assertEntry(io, expected, operation, committed);
  entries.push(Object.freeze({
    path,
    relative,
    kind,
    identity,
    mode: modeOf(final),
  }));
}

/** Change mode through one identity-checked open description, never through a mutable path. */
export async function changeEntryMode(
  io: Io,
  entry: ModeEntry,
  mode: number,
  desired: number,
  operation: t.FsRooted.Operation,
  committed: boolean,
): Promise<boolean> {
  let handle: ModeHandle;
  try {
    handle = await io.openMode(entry.path);
  } catch (cause) {
    if (isLostModePath(cause)) {
      throw failure(operation, 'ownership-lost', { cause, committed });
    }
    throw modeFailure(operation, cause, committed);
  }

  let changed = false;
  let pending: t.FsRooted.Failure | undefined;
  try {
    const opened = await handle.stat();
    assertModeInfo(entry, opened, operation, committed);
    const openedMode = modeOf(opened);
    if (openedMode === undefined) throw failure(operation, 'unsupported', { committed });
    if ((openedMode & 0o7777) !== (mode & 0o7777)) {
      throw failure(operation, 'ownership-lost', { committed });
    }

    if ((openedMode & 0o7777) !== (desired & 0o7777)) {
      try {
        await handle.chmod(desired & 0o7777);
        changed = true;
      } catch (cause) {
        try {
          const after = await handle.stat();
          assertModeInfo(entry, after, operation, committed);
          const afterMode = modeOf(after);
          changed = afterMode === undefined ||
            (afterMode & 0o7777) !== (openedMode & 0o7777);
        } catch {
          changed = true;
        }
        throw modeFailure(operation, cause, committed || changed);
      }

      const after = await handle.stat();
      assertModeInfo(entry, after, operation, true);
      const afterMode = modeOf(after);
      if (afterMode === undefined || (afterMode & 0o7777) !== (desired & 0o7777)) {
        throw failure(operation, 'unsupported', { committed: true });
      }
    }
  } catch (cause) {
    pending = toFailure(operation, cause, committed || changed);
  } finally {
    try {
      await handle.close();
    } catch (cause) {
      pending ??= toFailure(operation, cause, committed || changed);
    }
  }
  if (pending) throw pending;

  const current = await assertEntry(io, entry, operation, committed || changed);
  const currentMode = modeOf(current);
  if (currentMode === undefined || (currentMode & 0o7777) !== (desired & 0o7777)) {
    throw failure(operation, 'ownership-lost', { committed: committed || changed });
  }
  return changed;
}

async function restorePermissions(
  io: Io,
  entry: TreeEntry,
  mode: number,
  required: number,
  operation: t.FsRooted.Operation,
  committed: boolean,
): Promise<void> {
  await changeEntryMode(
    io,
    entry,
    mode,
    (mode & 0o7777) | required,
    operation,
    committed,
  );
}

async function assertEntry(
  io: Io,
  entry: Pick<TreeEntry, 'path' | 'kind' | 'identity'>,
  operation: t.FsRooted.Operation,
  committed: boolean,
): Promise<Deno.FileInfo> {
  const info = await lstatMaybe(io, entry.path, operation);
  if (!info || info.isSymlink) {
    throw failure(operation, 'ownership-lost', { committed });
  }
  if (
    (entry.kind === 'directory' && !info.isDirectory) ||
    (entry.kind === 'file' && !info.isFile)
  ) {
    throw failure(operation, 'ownership-lost', { committed });
  }
  if (entry.kind === 'file') {
    if (!Num.Is.safeInt(info.nlink) || info.nlink <= 0) {
      throw failure(operation, 'unsupported', { committed });
    }
    if (info.nlink !== 1) {
      throw failure(operation, 'unsafe-filesystem', { committed });
    }
  }
  identityRequired(info, operation, committed);
  if (!sameIdentity(entry.identity, info)) {
    throw failure(operation, 'ownership-lost', { committed });
  }
  return info;
}

function assertModeInfo(
  entry: ModeEntry,
  info: ModeInfo,
  operation: t.FsRooted.Operation,
  committed: boolean,
): void {
  if (
    (entry.kind === 'directory' && !info.isDirectory) ||
    (entry.kind === 'file' && !info.isFile)
  ) {
    throw failure(operation, 'ownership-lost', { committed });
  }
  if (!Num.Is.safeInt(info.dev) || !Num.Is.safeInt(info.ino)) {
    throw failure(operation, 'unsupported', { committed });
  }
  if (info.dev !== entry.identity.dev || info.ino !== entry.identity.ino) {
    throw failure(operation, 'ownership-lost', { committed });
  }
  if (entry.kind === 'file') {
    if (!Num.Is.safeInt(info.nlink) || info.nlink <= 0) {
      throw failure(operation, 'unsupported', { committed });
    }
    if (info.nlink !== 1) throw failure(operation, 'unsafe-filesystem', { committed });
  }
}

function modeFailure(
  operation: t.FsRooted.Operation,
  cause: unknown,
  committed: boolean,
): t.FsRooted.Failure {
  const code = errorCode(cause);
  if (
    cause instanceof Deno.errors.NotSupported ||
    cause instanceof Deno.errors.PermissionDenied ||
    code === 'EACCES' ||
    code === 'EPERM' ||
    code === 'EISDIR' ||
    code === 'ENOSYS'
  ) {
    return failure(operation, 'unsupported', { cause, committed });
  }
  return toFailure(operation, cause, committed);
}

function isLostModePath(cause: unknown): boolean {
  const code = errorCode(cause);
  return cause instanceof Deno.errors.NotFound ||
    code === 'ENOENT' ||
    code === 'ELOOP' ||
    code === 'ENOTDIR';
}

function errorCode(cause: unknown): unknown {
  return Is.object(cause) ? Reflect.get(cause, 'code') : undefined;
}

async function validateAuthority(
  tree: TreeAuthority,
  operation: t.FsRooted.Operation,
  committed: boolean,
): Promise<void> {
  try {
    await tree.validate(committed);
  } catch (cause) {
    throw toFailure(operation, cause, committed);
  }
}

function validName(name: unknown): name is string {
  return (
    Is.str(name) &&
    name.length > 0 &&
    name !== '.' &&
    name !== '..' &&
    !name.includes('\0') &&
    StdPath.basename(name) === name
  );
}

function modeOf(info: { readonly mode?: number | null }): number | undefined {
  return Num.Is.safeInt(info.mode) && info.mode >= 0 ? info.mode : undefined;
}

function sealedMode(kind: TreeEntry['kind'], mode: number): number {
  const required = kind === 'directory' ? OWNER_DIRECTORY_ACCESS : OWNER_READ;
  return ((mode & 0o7777) & ~WRITE_BITS) | required;
}

function isSealed(entry: Pick<TreeEntry, 'kind'>, mode: number): boolean {
  const required = entry.kind === 'directory' ? OWNER_DIRECTORY_ACCESS : OWNER_READ;
  return (mode & WRITE_BITS) === 0 && (mode & required) === required;
}

function sameSnapshot(left: readonly TreeEntry[], right: readonly TreeEntry[]): boolean {
  return sameTopology(left, right) &&
    left.every((entry, index) => entry.mode === right[index].mode);
}

function sameTopology(left: readonly TreeEntry[], right: readonly TreeEntry[]): boolean {
  return left.length === right.length && left.every((entry, index) => {
    const other = right[index];
    return (
      entry.relative === other.relative &&
      entry.kind === other.kind &&
      entry.identity.dev === other.identity.dev &&
      entry.identity.ino === other.identity.ino
    );
  });
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
