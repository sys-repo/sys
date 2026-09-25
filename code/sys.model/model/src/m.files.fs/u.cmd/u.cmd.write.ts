import { Is, type t } from '../common.ts';
import { fail } from '../u/u.error.ts';
import { isFilesFsError } from '../u/u.mutation.ts';
import { allowed } from '../u/u.policy.ts';
import { realScope, requiredVisiblePath, type Scope } from '../u/u.path.ts';
import { type WriteBody, writeBody } from '../u/u.write-body.ts';
import { writeTarget, writtenFileEntry } from '../u/u.write-plan.ts';

export type WritableScope = Scope<t.FilesFs.Capability.Writable>;

/** Implementation of the `files:write` command for writable files/fs backings. */
export const write = async (
  scope: WritableScope,
  policy: t.Files.Policy.Shape,
  payload: t.Files.Cmd.Write.Payload,
  maxWriteBytes: t.NumberBytes | undefined,
): Promise<t.Files.Cmd.Write.Result> => {
  if (!Is.plainObject(payload)) {
    throw fail('FilesFsError.InvalidPath', 'Files write payload must be a plain object');
  }

  const path = requiredVisiblePath(scope.fs, payload.path);
  if (path === '') throw fail('FilesFsError.InvalidPath', 'Cannot write files/fs root');
  if (!allowed(policy, 'write', path)) {
    throw fail('FilesFsError.PolicyDenied', `Write denied: ${path}`);
  }

  const body = writeBody(payload, path, maxWriteBytes);

  try {
    return await writeChecked(scope, policy, path, body);
  } catch (cause) {
    if (isFilesFsError(cause)) throw cause;
    throw fail('FilesFsError.Unsupported', `Write failed: ${path}`);
  }
};

async function writeChecked(
  scope: WritableScope,
  policy: t.Files.Policy.Shape,
  path: t.Files.String.Path,
  body: WriteBody,
): Promise<t.Files.Cmd.Write.Result> {
  const canonical = await realScope(scope);
  const target = await writeTarget(canonical, path);

  try {
    await canonical.fs.writeFileAtomic(target.absolute, body.bytes, {
      ...(body.mediaType === undefined ? {} : { mediaType: body.mediaType }),
    });
  } catch {
    throw fail('FilesFsError.Unsupported', `Write failed: ${path}`);
  }

  const entry = await writtenFileEntry(canonical, path, target.absolute);

  return {
    kind: target.previous ? 'modified' : 'created',
    path,
    ...(allowed(policy, 'stat', path) ? { entry } : {}),
  };
}
