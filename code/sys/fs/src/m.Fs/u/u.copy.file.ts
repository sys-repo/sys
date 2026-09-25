import { ensureDir, Err, exists, Path, pkg, type t } from '../common.ts';
import { Is } from '../m/m.Is.ts';
import { Wrangle } from './u.copy.util.ts';
import { remove } from './u.remove.ts';

/**
 * Copy an individual file.
 */
export const copyFile: t.Fs.CopyFile = async (from, to, opt = {}) => {
  const options = Wrangle.options(opt);
  const { log = false, force = false, ensureParent = true } = options;
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
    const msg = `Cannot copy file because the given path is a directory: ${from}`;
    errors.push(msg);
    return done();
  }

  const targetParent = Path.dirname(to);
  if (!ensureParent && !(await Is.dir(targetParent))) {
    errors.push(`Cannot copy file because target parent directory does not exist: ${targetParent}`);
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
    // Check if filtered.
    let allowCopy = true;
    if (typeof options.filter === 'function' && !Wrangle.filter(from, to, options.filter)) {
      allowCopy = false;
      errors.push(`Cannot copy file because the path has been filtered out: ${to}`);
    }

    // Copy the file.
    if (allowCopy) {
      if (ensureParent) await ensureDir(Path.dirname(to));
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
