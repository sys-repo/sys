import { type t, Fs, slug } from './common.ts';

/**
 * Testing helpers for working on a known server (eg. HTTP/network and file-system).
 */

export const dir: t.TestingServerLib['dir'] = async (dirname: string, options = {}) => {
  const location = options.location ?? 'os-temp';
  const localDir = Fs.resolve('./.tmp/test', dirname, (options.slug ?? true) ? slug() : '');
  const exists = (dir: string, path: string[]) => Fs.exists(Fs.join(dir, ...path));
  const dir = await (async () => {
    if (location === 'local-temp') return localDir;
    const prefix = `${dirname}${options.slug === false ? '-' : `-${slug()}-`}`;
    return (await Fs.makeTempDir({ prefix })).absolute;
  })();
  await Fs.ensureDir(dir);

  const api: t.TestingDir = {
    get dir() {
      return dir;
    },
    async exists(...path: string[]) {
      return exists(dir, path);
    },
    join(...parts: string[]) {
      return Fs.join(dir, ...parts);
    },

    async ls(trimRoot?: boolean) {
      const paths = await Fs.ls(dir);
      return trimRoot ? paths.map((p) => p.slice(dir.length + 1)) : paths;
    },
  };

  return api;
};
