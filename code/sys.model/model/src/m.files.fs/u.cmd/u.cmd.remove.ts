import { Is, type t } from '../common.ts';
import { entryFromStat } from '../u/u.entry.ts';
import { fail } from '../u/u.error.ts';
import { isFilesFsError, rejectSymlink, requireInsideRealScope } from '../u/u.mutation.ts';
import { allowed } from '../u/u.policy.ts';
import { removalEntries, type RemovalEntry } from '../u/u.remove-plan.ts';
import { absolutePath, realScope, requiredVisiblePath, type Scope } from '../u/u.path.ts';

export type WritableScope = Scope<t.FilesFs.Capability.Writable>;

export type RemoveMutation = {
  readonly result: t.Files.Cmd.Remove.Result;
  readonly deleted: readonly t.Files.String.Path[];
};

/** Implementation of the `files:remove` command for writable files/fs backings. */
export const remove = async (
  scope: WritableScope,
  policy: t.Files.Policy.Shape,
  payload: t.Files.Cmd.Remove.Payload,
): Promise<RemoveMutation> => {
  if (!Is.plainObject(payload)) {
    throw fail('FilesFsError.InvalidPath', 'Files remove payload must be a plain object');
  }
  if (payload.recursive !== undefined && !Is.bool(payload.recursive)) {
    throw fail('FilesFsError.InvalidPath', 'Files remove recursive flag must be boolean');
  }

  const path = requiredVisiblePath(scope.fs, payload.path);
  if (path === '') throw fail('FilesFsError.InvalidPath', 'Cannot remove files/fs root');
  if (!allowed(policy, 'remove', path)) {
    throw fail('FilesFsError.PolicyDenied', `Remove denied: ${path}`);
  }

  try {
    return await removeChecked(scope, policy, path, payload.recursive === true);
  } catch (cause) {
    if (isFilesFsError(cause)) throw cause;
    throw fail('FilesFsError.Unsupported', `Remove failed for ${path}`);
  }
};

async function removeChecked(
  scope: WritableScope,
  policy: t.Files.Policy.Shape,
  path: t.Files.String.Path,
  recursive: boolean,
): Promise<RemoveMutation> {
  const canonical = await realScope(scope);
  const target = absolutePath(canonical, path);
  const targetReal = await requireInsideRealScope(canonical, target, `Path not found: ${path}`);

  const lstat = await canonical.fs.lstat(target);
  if (!lstat) throw fail('FilesFsError.NotFound', `Path not found: ${path}`);
  if (lstat.isSymlink) await rejectSymlink(canonical, target);

  const info = await canonical.fs.stat(targetReal);
  if (!info) throw fail('FilesFsError.NotFound', `Path not found: ${path}`);
  const entry = entryFromStat(path, info);
  const entries = await removalEntries(
    canonical,
    policy,
    { path, absolute: target, real: targetReal, kind: entry.kind },
    recursive,
  );
  const deleted: t.Files.String.Path[] = [];
  for (const item of entries) {
    try {
      await canonical.fs.removeEntry(item.absolute);
      deleted.push(item.path);
    } catch {
      throw partialFailure(path, item.path, deleted);
    }
  }

  return {
    result: { kind: 'deleted', path },
    deleted,
  };
}

function partialFailure(
  root: t.Files.String.Path,
  failed: t.Files.String.Path,
  deleted: readonly t.Files.String.Path[],
): Error {
  if (deleted.length === 0) {
    return fail('FilesFsError.Unsupported', `Remove failed for ${failed}`);
  }
  return fail(
    'FilesFsError.PartialFailure',
    `Remove partially failed for ${root}; failed at ${failed}; deleted ${deleted.length} entries`,
  );
}
