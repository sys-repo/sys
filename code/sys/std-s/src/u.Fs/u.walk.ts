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
  const startDir = stat.isDirectory ? startAt : Path.dirname(startAt);
  let dir = Path.absolute(startDir).replace(/[/\\]+$/, ''); // Normalize the path to remove any trailing slashes.
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
    let _files: t.FsWalkFile[] | undefined;
    return {
      stop: () => (isStopped = true),
      async files() {
        if (_files) return _files;
        const res = await Array.fromAsync(walk(path, { includeDirs: false, maxDepth: 1 }));
        return (_files = res.map(toFile));
      },
      dir,
    };
  };

  while (true) {
    /**
     * Visitor: invoke callback.
     */
    await onVisit(toPayload(dir));
    if (isStopped) break;

    const parentDir = Path.dirname(dir);
    if (parentDir === dir) break; // NB: at root.

    dir = parentDir; // ← step-up.
  }
};
