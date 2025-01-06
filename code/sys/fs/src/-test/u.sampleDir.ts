import { type t, slug } from '../common.ts';
import { Fs, Path } from '../mod.ts';

/**
 * Helpers for working with a sample directory.
 */
export function sampleDir(dirname: string, options: { slug?: boolean } = {}) {
  let dir = Fs.resolve(`.tmp/test/${dirname}`);
  if (options.slug ?? true) dir = Path.join(dir, slug());

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
