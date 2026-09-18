import { Is, type t } from '../common.ts';
import { Join } from '../m/m.Join.ts';

/**
 * Curry a directory path for URLs.
 */
export const dir: t.Path.Lib['dir'] = (base, input) => {
  const options = wrangle.options(input);
  const join = Join.platform(options.platform);
  const api: t.Path.Dir.Builder = {
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
  options(input?: t.Path.Dir.Options | t.Path.Join.Platform): t.Path.Dir.Options {
    if (!input) return {};
    if (Is.string(input)) return { platform: input };
    return input;
  },
} as const;
