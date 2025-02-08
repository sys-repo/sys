import { type t, Fs, slug } from './common.ts';

/**
 * Testing helpers for working on a known server (eg. HTTP/network and file-system).
 */

export const dir: t.TestingServerLib['dir'] = (dirname: string, options = {}) => {
  const dir = Fs.resolve(`./.tmp/test/${dirname}`, options.slug ?? true ? slug() : '');
  const exists = (dir: string, path: string[]) => Fs.exists(Fs.join(dir, ...path));

  const api: t.TestingDir = {
    dir,
    exists: (...path: string[]) => exists(dir, path),
    join: (...parts: string[]) => Fs.join(dir, ...parts),

    async ls(trimRoot?: boolean) {
      const paths = await Fs.ls(dir);
      return trimRoot ? paths.map((p) => p.slice(dir.length + 1)) : paths;
    },

    async create() {
      await Fs.ensureDir(dir);
      return api;
    },
  };

  return api;
};
