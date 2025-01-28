import { type t, Err, exists, pkg } from './common.ts';
import { copyFile } from './u.copy.file.ts';
import { Wrangle } from './u.copy.util.ts';
import { remove } from './u.remove.ts';

/**
 * Copy all files in a directory.
 */
export const copyDir: t.FsCopyDir = async (from, to, opt = {}) => {
  const options = Wrangle.options(opt);
  const { force = false } = options;
  const errors = Err.errors();

  const done = () => {
    const error = errors.toError();
    if (error) {
      if (options.throw) throw error;
      if (options.log) console.warn(`ERROR: ${pkg.name}:Fs.copyDir →`, error);
    }
    return { error };
  };

  /*
   * Input guards.
   */
  if (typeof from !== 'string') {
    const value = String(from) || '<empty>';
    errors.push(`Copy error - source directory is not a valid: ${value}`);
    return done();
  }

  if (!(await exists(from))) {
    errors.push(`Copy error - source directory does not exist: ${from}`);
    return done();
  }

  if (await exists(to)) {
    if (force) {
      await remove(to); // NB: force overwrite
    } else {
      errors.push(`Cannot copy over existing directory: ${to}`);
      return done();
    }
  }

  try {
    /*
     * Copy operation.
     */
    for await (const entry of Deno.readDir(from)) {
      const source = `${from}/${entry.name}`;
      const target = `${to}/${entry.name}`;
      if (entry.isDirectory) {
        // NB: "/" suffix indicates to the filter that the path is a folder.
        if (!Wrangle.filter(`${source}/`, `${target}/`, options.filter)) continue;
        await copyDir(source, target, options); // ← Recursion 🌳
      } else if (entry.isFile) {
        await copyFile(source, target, options);
      }
    }
  } catch (error: any) {
    /**
     * Failure.
     */
    const cause = error;
    if (error instanceof Deno.errors.NotFound) {
      errors.push(Err.std(`File or directory to copy not found.`, { cause }));
    } else {
      errors.push(Err.std('Unexpected error while copying directory.', { cause }));
    }
  }

  // Success
  return done();
};
