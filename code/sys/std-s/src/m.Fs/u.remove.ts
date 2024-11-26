import { type t, c, exists } from './common.ts';
import { Path } from './m.Path.ts';

/**
 * Delete a directory (and it's contents).
 */
export const remove: t.FsRemove = async (path, options = {}) => {
  const targetExists = await exists(path);
  const shortPath = Path.trimCwd(path);

  if (options.dryRun) {
    const prefix = c.bgGreen(c.white(' dry run '));
    let line = `${prefix} ${c.cyan('delete')}: ${c.gray(shortPath)}`;
    if (!targetExists) line += c.yellow(' ← does not exist');
    console.info(line); // NB: dry-run always logs (otherwise no point).
    return targetExists;
  }

  if (!targetExists) return false;
  try {
    await Deno.remove(path, { recursive: true });
    if (options.log) console.info(`${c.cyan('deleted')} ${c.gray(shortPath)}`);
    return true;
  } catch (error: any) {
    if (error instanceof Deno.errors.NotFound) {
      return false; // NB: failure ignored - we are in the final desired state of no file.
    } else {
      throw error; // Re-throw the error to let the caller handle it.
    }
  }
};
