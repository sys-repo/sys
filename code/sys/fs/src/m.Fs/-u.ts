import { type t, Path, slug } from './common.ts';
import { Fs } from './mod.ts';

/**
 * Helpers for working with a sample directory.
 */
export function sampleDir(prefix: string, appendSlug: boolean = true) {
  let dir = Fs.resolve(`.tmp/test/${prefix}`);
  if (appendSlug) dir = Path.join(dir, slug());

  const api = {
    dir,
    join: (...parts: t.StringPath[]) => Fs.join(api.dir, ...parts),
    uniq: (...parts: t.StringPath[]) => api.join(...parts, slug()),
    async ensureExists(...paths: t.StringDir[]) {
      await Fs.ensureDir(dir);
      for (const path of paths) {
        await Fs.ensureDir(path);
      }
      return [dir, ...paths];
    },
  } as const;
  return api;
}
