import { type t, ensureDir, Err, exists } from './common.ts';
import { Path } from './m.Path.ts';

/**
 * Writes a string or binary file ensuring it's parent directory exists.
 */
export const write: t.FsWriteFile = async (path, data, options = {}) => {
  const { force = true } = options;
  const errors = Err.errors();
  let canWrite = true;

  path = Path.resolve(path);
  await ensureDir(Path.dirname(path));

  if (!force && (await exists(path))) {
    canWrite = false;
    errors.push(`Failed to write because a file already exists at: ${path}`);
  }

  if (canWrite) {
    if (typeof data === 'string') {
      await Deno.writeTextFile(path, data);
    } else {
      await Deno.writeFile(path, data);
    }
  }

  const error = errors.toError();
  return { error };
};
