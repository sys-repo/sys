import { type t, Fs } from './common.ts';
import { Data } from './m.Data.ts';

export const bundle: t.FileMapLib['bundle'] = async (dir) => {
  const res: t.FileMap = {};

  dir = Fs.resolve(dir);
  const paths = await wrangle.paths(dir);

  const wait = paths.map(async (path) => {
    const file = await wrangle.fileContent(path);
    if (file) {
      const key = wrangle.pathKey(path, dir);
      res[key] = file;
    }
  });

  await Promise.all(wait);

  return res;
};

/**
 * Helpers
 */
const wrangle = {
  async paths(dir: t.StringDir) {
    const includeDirs = false;
    const glob = Fs.glob(dir);
    return (await glob.find('**', { includeDirs })).map((m) => m.path);
  },

  pathKey(path: t.StringPath, base?: t.StringDir) {
    let key = path;
    if (base && key.startsWith(base)) key = key.slice(base.length + 1);
    return key;
  },

  async fileContent(path: t.StringPath) {
    if (!(await Fs.exists(path))) return;
    const contentType = Data.contentType(path);
    const text = await Deno.readTextFile(path);
    return Data.encode(contentType, text);
  },
} as const;
