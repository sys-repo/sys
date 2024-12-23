import { type t, ensureDir, Err, exists as fileExists } from './common.ts';
import { Path } from './m.Path.ts';

/**
 * Writes a string or binary file ensuring it's parent directory exists.
 */
export const write: t.FsWriteFile = async (path, data, options = {}) => {
  const { force = true } = options;
  const errors = Err.errors();
  let canWrite = true;
  let overwritten = false;

  path = Path.resolve(path);
  await ensureDir(Path.dirname(path));

  const exists = await fileExists(path);
  if (exists && !force) {
    const err = `Failed to write because a file already exists at: ${path}`;
    canWrite = false;
    if (options.throw) throw new Error(err);
    errors.push(err);
  }

  if (canWrite) {
    try {
      if (typeof data === 'string') {
        await Deno.writeTextFile(path, data);
      } else {
        await Deno.writeFile(path, data);
      }
      overwritten = exists;
    } catch (cause: any) {
      errors.push(`Failed while writing file: ${path}`, cause);
    }
  }

  const error = errors.toError();
  return {
    overwritten,
    error,
  };
};
