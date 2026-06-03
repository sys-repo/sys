import { Is, Str, type t } from '../common.ts';
import { fail, isFilesR2Error, provider } from '../u/error.ts';
import { descendantObjects, type Runtime } from '../u/runtime.ts';
import { objectKey, pathFromObjectKey, requiredVisiblePath } from '../u/path.ts';

export type RemoveMutation = {
  readonly result: t.Files.Cmd.Remove.Result;
  readonly deleted: readonly t.Files.String.Path[];
};

/** Implementation of the `files:remove` command for R2 Files backings. */
export async function remove(
  runtime: Runtime,
  payload: t.Files.Cmd.Remove.Payload,
): Promise<RemoveMutation> {
  if (!Is.plainObject(payload)) {
    throw fail('FilesR2Error.InvalidPath', 'Files remove payload must be a plain object');
  }
  if (payload.recursive !== undefined && !Is.bool(payload.recursive)) {
    throw fail('FilesR2Error.InvalidPath', 'Files remove recursive flag must be boolean');
  }

  const path = requiredVisiblePath(payload.path);
  if (path === '') throw fail('FilesR2Error.InvalidPath', 'Cannot remove R2 Files root');

  return await provider({
    action: 'Remove',
    path,
    async run() {
      const key = objectKey(runtime.prefix, path);
      const [object, descendants] = await Promise.all([
        runtime.bucket.stat(key),
        descendantObjects(runtime, path),
      ]);

      if (object && descendants.length > 0) {
        throw fail('FilesR2Error.InvalidPath', `R2 object tree collision: ${path}`);
      }
      if (!object && descendants.length === 0) {
        throw fail('FilesR2Error.NotFound', `Path not found: ${path}`);
      }

      const targets = object ? [{ key, path }] : descendantTargets(runtime.prefix, descendants);
      if (!object && payload.recursive !== true) {
        throw fail('FilesR2Error.DirectoryNotEmpty', `Directory not empty: ${path}`);
      }
      for (const target of targets) {
        if (!runtime.authority.allows('remove', target.path)) {
          throw fail('FilesR2Error.PolicyDenied', `Remove denied: ${target.path}`);
        }
      }

      const deleted: t.Files.String.Path[] = [];
      for (const target of targets) {
        try {
          await runtime.bucket.remove(target.key);
          deleted.push(target.path);
        } catch (cause) {
          if (isFilesR2Error(cause)) throw cause;
          throw partialFailure(path, target.path, deleted, cause);
        }
      }

      return { result: { kind: 'deleted', path }, deleted };
    },
  });
}

function descendantTargets(
  prefix: string,
  objects: readonly t.R2.ObjectInfo[],
): readonly { readonly key: string; readonly path: t.Files.String.Path }[] {
  const compare = Str.Compare.codeUnit();
  return objects
    .map((object) => ({ key: object.key, path: pathFromObjectKey(prefix, object.key) }))
    .filter((item): item is { readonly key: string; readonly path: t.Files.String.Path } => {
      return item.path !== undefined && item.path !== '';
    })
    .sort((a, b) => b.path.length - a.path.length || compare(a.path, b.path));
}

function partialFailure(
  root: t.Files.String.Path,
  failed: t.Files.String.Path,
  deleted: readonly t.Files.String.Path[],
  cause: unknown,
): Error {
  if (deleted.length === 0) {
    return fail('FilesR2Error.Unsupported', `Remove failed for ${failed}`, cause);
  }
  return fail(
    'FilesR2Error.PartialFailure',
    `Remove partially failed for ${root}; failed at ${failed}; deleted ${deleted.length} objects`,
    cause,
  );
}
