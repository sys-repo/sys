import { type t, Fs, Obj } from './common.ts';
import { Data } from './m.Data.ts';
import { Is } from './m.Is.ts';
import { toFilterArgs } from './u.filter.ts';

export const toMap: t.FileMapLib['toMap'] = async (dir, opt) => {
  const res: t.FileMap = {};
  const options = wrangle.options(opt);

  dir = Fs.resolve(dir);
  const paths = await wrangle.paths(dir);

  const wait = paths.map(async (path) => {
    const value = await wrangle.fileContent(path);
    if (!value) return;

    if (options.filter) {
      const args = toFilterArgs(path.slice(dir.length + 1), value);
      if (!options.filter(args)) return;
    }

    const key = wrangle.pathKey(path, dir);
    res[key] = value;
  });

  await Promise.all(wait);
  return Obj.sortKeys(res);
};

/**
 * Helpers:
 */
const wrangle = {
  async paths(dir: t.StringDir) {
    const includeDirs = false;
    const glob = Fs.glob(dir, { includeDirs });
    const paths = (await glob.find('**')).map((m) => m.path);
    return paths;
  },

  pathKey(path: t.StringPath, base?: t.StringDir) {
    let key = path;
    if (base && key.startsWith(base)) key = key.slice(base.length + 1);
    return key;
  },

  async fileContent(path: t.StringPath) {
    const mime = Data.contentType.fromPath(path);
    if (!mime) return;

    const read = Is.contentType.string(mime) ? Fs.readText : Fs.read;
    const res = await read(path);
    return res.data ? Data.encode(mime, res.data) : undefined;
  },

  options(input?: t.FileMapToMapOptions | t.FileMapFilter) {
    if (!input) return {};
    if (typeof input === 'function') return { filter: input };
    return input;
  },
} as const;
