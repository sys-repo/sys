import { type t, Path } from '../common.ts';

const join = Path.Join.posix; // NB: posix joiner to ensure use of ("/") forward-slash for URLs.
type Options = { onPath?: t.PathHandler };
type OptionsInput = Options | t.PathHandler;

/**
 * Curry a directory path for URLs.
 */
export const dirPath = (dir: string, options?: OptionsInput) => {
  const { onPath } = wrangle.options(options);
  const api = {
    dir: (path: string, options?: OptionsInput) => dirPath(join(dir, path), options),
    toString: () => dir,
    path(...parts: string[]) {
      const path = join(dir, ...parts);
      onPath?.({ path });
      return path;
    },
  } as const;
  return api;
};

/**
 * Helpers:
 */
const wrangle = {
  options(input?: OptionsInput): Options {
    if (!input) return {};
    if (typeof input === 'function') return { onPath: input };
    return input;
  },
} as const;
