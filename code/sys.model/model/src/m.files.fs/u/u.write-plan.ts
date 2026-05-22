import { FilesPath } from '../../m.files/u/u.path.ts';
import { type t } from '../common.ts';
import { entryFromStat } from './u.entry.ts';
import { fail } from './u.error.ts';
import { rejectSymlink } from './u.mutation.ts';
import { absolutePath, assertRealInside, type Scope } from './u.path.ts';

export type WritableScope = Scope<t.FilesFs.Capability.Writable>;

export type WriteTarget = {
  readonly absolute: t.StringAbsolutePath;
  readonly previous?: t.Files.Entry.File;
};

/** Preflight the target and parent directory for a complete-file write. */
export const writeTarget = async (
  scope: WritableScope,
  path: t.Files.String.Path,
): Promise<WriteTarget> => {
  const absolute = absolutePath(scope, path);
  const previous = await existingFile(scope, path, absolute);
  await ensureParentDirectory(scope, path);
  return { absolute, ...(previous === undefined ? {} : { previous }) };
};

/** Read back the written target metadata after the atomic host mutation. */
export const writtenFileEntry = async (
  scope: WritableScope,
  path: t.Files.String.Path,
  absolute: t.StringAbsolutePath,
): Promise<t.Files.Entry.File> => {
  const real = await assertRealInside(scope, absolute);
  if (!real) throw fail('FilesFsError.NotFound', `File not found: ${path}`);
  const info = await scope.fs.stat(real);
  if (!info) throw fail('FilesFsError.NotFound', `File not found: ${path}`);
  const entry = entryFromStat(path, info);
  if (entry.kind !== 'file') throw fail('FilesFsError.NotFile', `Not a file: ${path}`);
  return entry;
};

const existingFile = async (
  scope: WritableScope,
  path: t.Files.String.Path,
  absolute: t.StringAbsolutePath,
): Promise<t.Files.Entry.File | undefined> => {
  const lstat = await scope.fs.lstat(absolute);
  if (!lstat) return undefined;
  if (lstat.isSymlink) await rejectSymlink(scope, absolute);

  const real = await assertRealInside(scope, absolute);
  if (!real) return undefined;
  const info = await scope.fs.stat(real);
  if (!info) throw fail('FilesFsError.NotFound', `File not found: ${path}`);
  const entry = entryFromStat(path, info);
  if (entry.kind !== 'file') throw fail('FilesFsError.NotFile', `Not a file: ${path}`);
  return entry;
};

const ensureParentDirectory = async (
  scope: WritableScope,
  path: t.Files.String.Path,
): Promise<void> => {
  const parent = FilesPath.parent(path, invalidPath);
  const parentAbsolute = absolutePath(scope, parent);
  if (parent === '') {
    await assertDirectory(scope, parent, parentAbsolute);
    return;
  }

  const segments = parent.split('/').filter(Boolean);
  let current = '' as t.Files.String.Path;
  for (const segment of segments) {
    current = (current ? `${current}/${segment}` : segment) as t.Files.String.Path;
    const absolute = absolutePath(scope, current);
    const lstat = await scope.fs.lstat(absolute);
    if (!lstat) {
      try {
        await scope.fs.ensureDir(parentAbsolute);
      } catch {
        throw fail('FilesFsError.Unsupported', `Write failed: ${path}`);
      }
      await assertDirectory(scope, parent, parentAbsolute);
      return;
    }
    if (lstat.isSymlink) await rejectSymlink(scope, absolute);
    const entry = entryFromStat(current, lstat);
    if (entry.kind !== 'dir') {
      throw fail('FilesFsError.NotDirectory', `Not a directory: ${current}`);
    }
  }

  await assertDirectory(scope, parent, parentAbsolute);
};

const assertDirectory = async (
  scope: WritableScope,
  path: t.Files.String.Path,
  absolute: t.StringAbsolutePath,
): Promise<void> => {
  const real = await assertRealInside(scope, absolute);
  if (!real) throw fail('FilesFsError.NotFound', `Directory not found: ${path}`);
  const info = await scope.fs.stat(real);
  if (!info) throw fail('FilesFsError.NotFound', `Directory not found: ${path}`);
  const entry = entryFromStat(path, info);
  if (entry.kind !== 'dir') throw fail('FilesFsError.NotDirectory', `Not a directory: ${path}`);
};

const invalidPath = (message: string): Error => fail('FilesFsError.InvalidPath', message);
