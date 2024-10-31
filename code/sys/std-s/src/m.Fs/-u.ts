import { type t, slug } from './common.ts';
import { Fs } from './mod.ts';

/**
 * Helpers for working with a sample directory.
 */
export function sampleDir(prefix: string = '') {
  if (prefix) prefix = `${prefix}-`;
  const dir = Fs.resolve(`./.tmp/test/${prefix}${slug()}`);
  const api = {
    dir,
    join: (...parts: t.StringPath[]) => Fs.join(api.dir, ...parts),
    uniq: (...parts: t.StringPath[]) => api.join(...parts, slug()),
  } as const;
  return api;
}
