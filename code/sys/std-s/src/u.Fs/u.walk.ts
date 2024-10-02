import { walk, type WalkEntry } from '@std/fs';
import { Path, type t } from './common.ts';

export { walk };

/**
 * Walks up the directory tree from the starting path to the root.
 * @param startAt - The initial directory path to start walking from.
 * @param onVisit - A function to execute at each directory level.
 */
export const walkUp: t.FsWalkUp = async (startAt, onVisit) => {
  const stat = await Deno.stat(startAt);
  const startAtDir = stat.isDirectory ? startAt : Path.dirname(startAt);
  let dir = Path.asAbsolute(startAtDir).replace(/[/\\]+$/, ''); // Normalize the path to remove any trailing slashes.
  let isStopped = false;

  const toFile = ({ name, isSymlink }: WalkEntry): t.FsWalkFile => {
    return {
      path: Path.join(dir, name),
      dir,
      name,
      isSymlink,
    };
  };

  const toPayload = (path: string): t.FsWalkUpCallbackArgs => {
    return {
      dir,
      async files() {
        const res = await Array.fromAsync(walk(path, { includeDirs: false, maxDepth: 1 }));
        return res.map(toFile);
      },
      stop: () => (isStopped = true),
    };
  };

  while (true) {
    // Execute the callback with the current path
    await onVisit(toPayload(dir));
    if (isStopped) break;

    // If the current path is the same as its parent, we've reached the root
    const parentDir = Path.dirname(dir);
    if (parentDir === dir) break;

    dir = parentDir;
  }
};
