import { type t, ensureDir, Err, exists, pkg } from './common.ts';
import { remove } from './u.remove.ts';

/**
 * Copy all files in a directory.
 */
export const copyDir: t.FsCopyDir = async (from, to, options = {}) => {
  const { log = false, force = false } = options;
  const errors = Err.errors();

  const done = () => {
    const error = errors.toError();
    if (error && log) console.warn(`ERROR: ${pkg.name}:Fs.copyDir →`, error);
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

  try {
    /**
     * Setup target directory.
     */
    if (await exists(to)) {
      if (force) {
        await remove(to); // NB: force overwrite
      } else {
        const msg = `Cannot copy over existing directory: ${to}`;
        errors.push(msg);
        return done();
      }
    }
    await ensureDir(to);

    /*
     * Copy operation.
     */
    for await (const entry of Deno.readDir(from)) {
      const source = `${from}/${entry.name}`;
      const target = `${to}/${entry.name}`;
      if (entry.isDirectory) {
        await copyDir(source, target);
      } else if (entry.isFile) {
        await Deno.copyFile(source, target);
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
