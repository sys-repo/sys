import { type t, ensureDir, Err, exists, Path, pkg } from './common.ts';
import { Is } from './m.Is.ts';
import { remove } from './u.remove.ts';
import { Wrangle } from './u.copy.util.ts';

/**
 * Copy an individual file.
 */
export const copyFile: t.FsCopyFile = async (from, to, opt = {}) => {
  const options = Wrangle.options(opt);
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
    errors.push(`Cannot copy file because source file path is not a valid: ${value}`);
    return done();
  }

  if (!(await exists(from))) {
    errors.push(`Cannot copy file because source file does not exist: ${from}`);
    return done();
  }

  if (await Is.dir(from)) {
    const msg = `Cannot copy file because the given path is a directory: ${to}`;
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
    // Check if filtered
    let allowCopy = true;
    if (typeof options.filter === 'function' && !Wrangle.filter(to, options.filter)) {
      allowCopy = false;
      errors.push(`Cannot copy file because the path has been filtered out: ${to}`);
    }

    // Copy the file.
    if (allowCopy) {
      await ensureDir(Path.dirname(to));
      await Deno.copyFile(from, to);
    }
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
