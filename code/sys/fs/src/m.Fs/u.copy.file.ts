import { type t, ensureDir, Err, exists, Path, pkg } from './common.ts';
import { Is } from './m.Is.ts';
import { remove } from './u.remove.ts';

/**
 * Copy an individual file.
 */
export const copyFile: t.FsCopyFile = async (from, to, options = {}) => {
  const { log = false, force = false } = options;
  const errors = Err.errors();

  const done = () => {
    const error = errors.toError();
    if (error) {
      if (options.throw) throw error;
      if (options.log) console.warn(`ERROR: ${pkg.name}:Fs.copyFile →`, error);
    }
    return { error };
  };

  /*
   * Input guards.
   */
  if (typeof from !== 'string') {
    const value = String(from) || '<empty>';
    errors.push(`Copy error - source file path is not a valid: ${value}`);
    return done();
  }

  if (!(await exists(from))) {
    errors.push(`Copy error - source file does not exist: ${from}`);
    return done();
  }

  if (await Is.dir(from)) {
    const msg = `Cannot copy file - the given path is a directory: ${to}`;
    errors.push(msg);
    return done();
  }

  if (await exists(to)) {
    if (force) {
      await remove(to, { log }); // NB: force replace.
    } else {
      const kind = (await Is.dir(to)) ? 'directory' : 'file';
      const msg = `Cannot copy over existing ${kind}: ${to}`;
      errors.push(msg);
      return done();
    }
  }

  try {
    // Copy the file.
    await ensureDir(Path.dirname(to));
    await Deno.copyFile(from, to);
  } catch (error: any) {
    /**
     * Failure.
     */
    const cause = error;
    if (error instanceof Deno.errors.NotFound) {
      errors.push(Err.std(`File or directory to copy not found.`, { cause }));
    } else {
      errors.push(Err.std('Unexpected error while copying file.', { cause }));
    }
  }

  // Success
  return done();
};
