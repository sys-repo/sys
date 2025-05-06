import { Path } from '../common.ts';
const join = Path.Join.posix; // NB: posix joiner to ensure use of ("/") forward-slash for URLs.

/**
 * Curry a directory path for URLs.
 */
export const dirPath = (dir: string) =>
  ({
    dir: (path: string) => dirPath(join(dir, path)),
    toString: () => dir,
    path: (...parts: string[]) => join(dir, ...parts),
  } as const);
