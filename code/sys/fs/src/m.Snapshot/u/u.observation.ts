import { Num, type t } from '../common.ts';
import { failure, hostFailure, isFailure } from './u.failure.ts';

const NativeDate = Date;
const getTime = NativeDate.prototype.getTime;
const freeze = Object.freeze;

/** Observe one path without following its final symlink, with lifecycle checkpoints. */
export async function lstat(
  io: t.SnapshotIo,
  path: string,
  context: t.SnapshotContext,
): Promise<t.SnapshotObservation> {
  context.checkpoint();
  try {
    const result = observe(await io.lstat(path));
    context.checkpoint();
    return result;
  } catch (cause) {
    if (isFailure(cause)) throw cause;
    context.checkpoint();
    throw hostFailure(cause);
  }
}

/** Observe the owned handle with lifecycle checkpoints. */
export async function statHandle(
  handle: t.SnapshotHandle,
  context: t.SnapshotContext,
): Promise<t.SnapshotObservation> {
  context.checkpoint();
  try {
    const result = observe(await handle.stat());
    context.checkpoint();
    return result;
  } catch (cause) {
    if (isFailure(cause)) throw cause;
    context.checkpoint();
    throw hostFailure(cause);
  }
}

/** Determine whether an observation supplies both valid identity components. */
export function hasIdentity(input: t.SnapshotObservation): boolean {
  return input.device !== null && input.inode !== null;
}

/** Require a regular file with an admissible observed byte extent. */
export function requireRegularFile(input: t.SnapshotObservation): void {
  if (input.symlink || !input.file || input.directory) throw failure('unsafe-filesystem');
  if (!Num.Is.safeInt(input.size) || input.size < 0) throw failure('source-changed');
}

/** Reject kind/size drift and differing timestamps or complete identities available in both. */
export function compareObservation(
  left: t.SnapshotObservation,
  right: t.SnapshotObservation,
): void {
  if (
    left.file !== right.file || left.directory !== right.directory || left.symlink !== right.symlink
  ) {
    throw failure('source-changed');
  }
  if (left.size !== right.size) throw failure('source-changed');
  if (left.modified !== null && right.modified !== null && left.modified !== right.modified) {
    throw failure('source-changed');
  }
  if (left.changed !== null && right.changed !== null && left.changed !== right.changed) {
    throw failure('source-changed');
  }
  if (
    hasIdentity(left) &&
    hasIdentity(right) &&
    (left.device !== right.device || left.inode !== right.inode)
  ) {
    throw failure('source-changed');
  }
}

function observe(info: Deno.FileInfo): t.SnapshotObservation {
  return freeze({
    file: info.isFile,
    directory: info.isDirectory,
    symlink: info.isSymlink,
    size: info.size,
    modified: observedTime(info.mtime),
    changed: observedTime(info.ctime),
    device: identityPart(info.dev),
    inode: identityPart(info.ino),
  });
}

function observedTime(input: Date | null): number | null {
  if (input === null) return null;
  try {
    const value = getTime.call(input);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function identityPart(input: number | null): number | null {
  return Num.Is.safeInt(input) && input >= 0 ? input : null;
}
