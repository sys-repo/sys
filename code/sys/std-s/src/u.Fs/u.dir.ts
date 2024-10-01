import type { t } from './common.ts';
import { c } from '@sys/std';
import { exists } from '@std/fs';

/**
 * Copy all files in a directory.
 */
export const copyDir: t.CopyDir = async (sourceDir: string, targetDir: string) => {
  await Deno.mkdir(targetDir, { recursive: true });
  for await (const entry of Deno.readDir(sourceDir)) {
    const srcPath = `${sourceDir}/${entry.name}`;
    const destPath = `${targetDir}/${entry.name}`;
    if (entry.isDirectory) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile) {
      await Deno.copyFile(srcPath, destPath);
    }
  }
};

/**
 * Delete a directory (and it's contents).
 */
export const removeDir: t.RemoveDir = async (path, options = {}) => {
  const dirExists = await exists(path);

  if (options.dry) {
    const prefix = c.bgGreen(c.white(' dry run '));
    let line = `${prefix} ${c.red('Delete')}: ${c.white(path)}`;
    if (!dirExists) line += c.yellow(' ← does not exist');
    console.info(line);
    return;
  }

  if (!dirExists) return undefined;
  await Deno.remove(path, { recursive: true });

  if (options.log) {
    console.info(`${c.cyan('deleted')} ${c.white(path)}`);
  }
};
