import { type t } from './common.ts';
import { Join } from './m.Join.ts';

/**
 * Curry a directory path for URLs.
 */
export const dir: t.PathLib['dir'] = (base, input) => {
  const options = wrangle.options(input);
  const join = Join.platform(options.platform);
  const api: t.PathDirBuilder = {
    dir: (path: string) => dir(join(base, path), options),
    path: (...parts: string[]) => join(base, ...parts),
    toString: () => base,
  };
  return api;
};

/**
 * Helpers:
 */
const wrangle = {
  options(input?: t.PathDirOptions | t.PathJoinPlatform): t.PathDirOptions {
    if (!input) return {};
    if (typeof input === 'string') return { platform: input };
    return input;
  },
} as const;
