import { type t } from '../common.ts';
import { dirEntry, fileEntryFromMeta } from '../u/entry.ts';
import { fail, provider } from '../u/error.ts';
import { hasDescendants, type Runtime } from '../u/runtime.ts';
import { objectKey, requiredVisiblePath } from '../u/path.ts';

/** Implementation of the `files:stat` command for R2 Files backings. */
export async function stat(
  runtime: Runtime,
  payload: t.Files.Cmd.Stat.Payload,
): Promise<t.Files.Cmd.Stat.Result> {
  const path = requiredVisiblePath(payload.path);
  if (path === '') return { entry: dirEntry(path) };

  return await provider({
    action: 'Stat',
    path,
    async run() {
      const key = objectKey(runtime.prefix, path);
      const [object, descendants] = await Promise.all([
        runtime.bucket.stat(key),
        hasDescendants(runtime, path),
      ]);

      if (object && descendants) {
        throw fail('FilesR2Error.InvalidPath', `R2 object tree collision: ${path}`);
      }
      if (object) return { entry: fileEntryFromMeta(path, object) };
      if (descendants) return { entry: dirEntry(path) };
      throw fail('FilesR2Error.NotFound', `Path not found: ${path}`);
    },
  });
}
