import { type t } from '../common.ts';
import { entryFromStat } from './u.entry.ts';
import { fail } from './u.error.ts';
import { allowed } from './u.policy.ts';
import { relativePath, type Scope } from './u.path.ts';
import { rejectSymlink, requireInsideRealScope, throwFilesFsOrUnsupported } from './u.mutation.ts';

export type WritableScope = Scope<t.FilesFs.Capability.Writable>;

export type RemovalEntry = {
  readonly path: t.Files.String.Path;
  readonly absolute: t.StringAbsolutePath;
};

export type RemovalTarget = RemovalEntry & {
  readonly real: t.StringAbsolutePath;
  readonly kind: t.Files.Entry.Kind;
};

/** Build the deletion order for a remove command after target validation. */
export const removalEntries = async (
  scope: WritableScope,
  policy: t.Files.Policy.Shape,
  target: RemovalTarget,
  recursive: boolean,
): Promise<readonly RemovalEntry[]> => {
  if (target.kind !== 'dir') return [removalEntry(target)];

  if (!recursive) {
    if (await hasDescendants(scope, target.path, target.real)) {
      throw fail('FilesFsError.DirectoryNotEmpty', `Directory not empty: ${target.path}`);
    }
    return [removalEntry(target)];
  }

  const descendants = await descendantEntries(scope, target.path, target.real);
  await assertRecursiveRemovalAllowed(scope, policy, target.path, descendants);
  return [...descendants, removalEntry(target)];
};

const removalEntry = (target: RemovalEntry): RemovalEntry => ({
  path: target.path,
  absolute: target.absolute,
});

/** Cheap non-recursive non-empty check that intentionally avoids descendant preflight. */
export const hasDescendants = async (
  scope: WritableScope,
  rootPath: t.Files.String.Path,
  rootReal: t.StringAbsolutePath,
): Promise<boolean> => {
  try {
    const walked = await scope.fs.walk(rootReal);
    for await (const _item of walked) return true;
    return false;
  } catch (cause) {
    return throwFilesFsOrUnsupported(cause, `Remove failed for ${rootPath}`);
  }
};

/** Discover descendant paths for recursive remove preflight and deepest-first mutation. */
export const descendantEntries = async (
  scope: WritableScope,
  rootPath: t.Files.String.Path,
  rootReal: t.StringAbsolutePath,
): Promise<readonly RemovalEntry[]> => {
  const entries: RemovalEntry[] = [];

  try {
    const walked = await scope.fs.walk(rootReal);
    for await (const item of walked) {
      const absolute = scope.fs.Path.Is.absolute(item.path)
        ? item.path
        : scope.fs.Path.resolve(rootReal, item.path);
      const path = relativePath(scope, absolute);
      if (path === '' || path === rootPath) continue;
      entries.push({ path, absolute });
    }
  } catch (cause) {
    throwFilesFsOrUnsupported(cause, `Remove failed for ${rootPath}`);
  }

  return entries.sort((a, b) => b.path.length - a.path.length || b.path.localeCompare(a.path));
};

/** Preflight all recursive descendants before any remove mutation is attempted. */
export const assertRecursiveRemovalAllowed = async (
  scope: WritableScope,
  policy: t.Files.Policy.Shape,
  rootPath: t.Files.String.Path,
  entries: readonly RemovalEntry[],
): Promise<void> => {
  try {
    for (const entry of entries) {
      if (!allowed(policy, 'remove', entry.path)) {
        throw fail('FilesFsError.PolicyDenied', `Remove denied: ${entry.path}`);
      }

      const lstat = await scope.fs.lstat(entry.absolute);
      if (!lstat) throw fail('FilesFsError.NotFound', `Path not found: ${entry.path}`);
      if (lstat.isSymlink) await rejectSymlink(scope, entry.absolute);
      await requireInsideRealScope(scope, entry.absolute, `Path not found: ${entry.path}`);

      const info = entryFromStat(entry.path, lstat);
      if (info.kind !== 'file' && info.kind !== 'dir') {
        throw fail('FilesFsError.Unsupported', `Unsupported Files entry: ${entry.path}`);
      }
    }
  } catch (cause) {
    throwFilesFsOrUnsupported(cause, `Remove failed for ${rootPath}`);
  }
};
