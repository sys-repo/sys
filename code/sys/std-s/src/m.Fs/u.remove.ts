import { exists } from '@std/fs';
import { c, type t } from './common.ts';

/**
 * Delete a directory (and it's contents).
 */
export const remove: t.FsRemove = async (path, options = {}) => {
  const targetExists = await exists(path);

  if (options.dryRun) {
    const prefix = c.bgGreen(c.white(' dry run '));
    let line = `${prefix} ${c.cyan('delete')}: ${c.white(path)}`;
    if (!targetExists) line += c.yellow(' ← does not exist');
    console.info(line); // NB: dry-run always logs (otherwise no point).
    return;
  }

  if (!targetExists) return undefined;
  await Deno.remove(path, { recursive: true });
  if (options.log) console.info(`${c.cyan('deleted')} ${c.white(path)}`);
};
