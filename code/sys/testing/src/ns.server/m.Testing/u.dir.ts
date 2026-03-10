import { type t, Fs, slug } from './common.ts';

/**
 * Testing helpers for working on a known server (eg. HTTP/network and file-system).
 */

export const dir: t.TestingServerLib['dir'] = (dirname: string, options = {}) => {
  const location = options.location ?? 'os-temp';
  const localDir = Fs.resolve('./.tmp/test', dirname, (options.slug ?? true) ? slug() : '');
  let systemDir = '';
  const exists = (dir: string, path: string[]) => Fs.exists(Fs.join(dir, ...path));
  const resolveDir = async () => {
    if (location === 'local-temp') return localDir;
    if (!systemDir) {
      const prefix = `${dirname}${options.slug === false ? '-' : `-${slug()}-`}`;
      systemDir = (await Fs.makeTempDir({ prefix })).absolute;
    }
    return systemDir;
  };

  const api: t.TestingDir = {
    get dir() {
      return location === 'local-temp' ? localDir : wrangle.systemDir(systemDir, dirname);
    },
    async exists(...path: string[]) {
      if (location === 'os-temp' && !systemDir) return false;
      const dir = await resolveDir();
      return exists(dir, path);
    },
    join(...parts: string[]) {
      const dir = location === 'local-temp' ? localDir : wrangle.systemDir(systemDir, dirname);
      return Fs.join(dir, ...parts);
    },

    async ls(trimRoot?: boolean) {
      if (location === 'os-temp' && !systemDir) return [];
      const dir = await resolveDir();
      const paths = await Fs.ls(dir);
      return trimRoot ? paths.map((p) => p.slice(dir.length + 1)) : paths;
    },

    async create() {
      const dir = await resolveDir();
      await Fs.ensureDir(dir);
      return api;
    },
  };

  return api;
};

/**
 * Helpers:
 */
const wrangle = {
  systemDir(dir: string, dirname: string) {
    if (dir) return dir;
    const err = `Testing.dir("${dirname}") with location "os-temp" requires await .create() before using "dir" or "join".`;
    throw new Error(err);
  },
} as const;
