import { Path } from '../common.ts';

/**
 * Curry a directory path.
 */
export const dirPath = (...dir: string[]) =>
  ({
    dir: (path: string) => dirPath(...dir, path),
    path: (...path: string[]) => Path.join(...dir, ...path),
    toString: () => dir,
  } as const);
