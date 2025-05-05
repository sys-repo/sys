import { Path } from '../common.ts';

/**
 * Curry a directory path for URLs.
 */
export const dirPath = (...dir: string[]) =>
  ({
    dir: (path: string) => dirPath(...dir, path),
    path: (...path: string[]) => Path.Join.posix(...dir, ...path),
    toString: () => dir,
  } as const);
