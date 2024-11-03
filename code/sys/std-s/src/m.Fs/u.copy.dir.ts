import { type t, ensureDir, Err, exists, pkg } from './common.ts';
import { remove } from './u.remove.ts';

/**
 * Copy all files in a directory.
 */
export const copyDir: t.FsCopyDir = async (sourceDir, targetDir, options = {}) => {
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
  if (typeof sourceDir !== 'string') {
    const value = String(sourceDir) || '<empty>';
    errors.push(`Copy error - source directory is not a valid: ${value}`);
    return done();
  }

  if (!(await exists(sourceDir))) {
    errors.push(`Copy error - source directory does not exist: ${sourceDir}`);
    return done();
  }

  try {
    /**
     * Setup target directory.
     */
    if (await exists(targetDir)) {
      if (force) {
        await remove(targetDir); // NB: force overwrite
      } else {
        const msg = `Cannot copy over existing target directory (pass {force} option to overwrite): ${targetDir}`;
        errors.push(msg);
        return done();
      }
    }
    await ensureDir(targetDir);

    /*
     * Copy operation.
     */
    for await (const entry of Deno.readDir(sourceDir)) {
      const srcPath = `${sourceDir}/${entry.name}`;
      const destPath = `${targetDir}/${entry.name}`;
      if (entry.isDirectory) {
        await copyDir(srcPath, destPath);
      } else if (entry.isFile) {
        await Deno.copyFile(srcPath, destPath);
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
      error.push('Unexpected error while copying directory.', { cause });
    }
  }

  // Success
  return done();
};
