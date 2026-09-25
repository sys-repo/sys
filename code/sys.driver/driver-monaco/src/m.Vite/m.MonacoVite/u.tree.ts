import { Fs, Is, Num, Path } from './common.ts';
import type { TreeStats } from './t.ts';
import { fail } from './u.error.ts';

/** Inspect a tree without following symbolic links or accepting special entries. */
export async function inspectTree(dir: string): Promise<TreeStats> {
  if (!Is.string(dir) || !dir.trim()) fail(`Invalid runtime tree path: ${String(dir)}.`);

  const root = Fs.resolve(dir);
  const rootStat = await Fs.lstat(root);
  if (!rootStat?.isDirectory || rootStat.isSymlink) {
    fail(`Missing regular runtime asset tree: ${root}.`);
  }

  const sizes: number[] = [];
  await visit(root);

  if (sizes.length < 1) fail(`Runtime asset tree is empty: ${root}.`);
  return { bytes: Num.sum(sizes), files: sizes.length };

  async function visit(dir: string): Promise<void> {
    for await (const entry of Deno.readDir(dir)) {
      const path = Fs.join(dir, entry.name);
      const relative = Path.relative(root, path) || entry.name;
      const stat = await Fs.lstat(path);
      if (!stat) fail(`Runtime entry disappeared while inspecting: ${relative}.`);
      if (stat.isSymlink) fail(`Symbolic links are not allowed in the runtime tree: ${relative}.`);
      if (stat.isDirectory) {
        await visit(path);
        continue;
      }
      if (!stat.isFile) fail(`Special entries are not allowed in the runtime tree: ${relative}.`);
      sizes.push(stat.size);
    }
  }
}

/** Read one required regular file without following a final symbolic link. */
export async function readRegularFile(path: string): Promise<Uint8Array> {
  const stat = await Fs.lstat(path);
  if (!stat?.isFile || stat.isSymlink) fail(`Missing required regular file: ${path}.`);

  const result = await Fs.read(path);
  if (!result.ok || !result.data) fail(`Could not read required file: ${path}.`);
  return result.data;
}
