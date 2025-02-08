import { type t, Fs, Path } from './common.ts';
import { Data } from './m.Data.ts';
import { Is } from './m.Is.ts';

export const bundle: t.FileMapLib['bundle'] = async (dir, opt) => {
  const res: t.FileMap = {};
  const options = wrangle.options(opt);

  dir = Fs.resolve(dir);
  let paths = await wrangle.paths(dir);
  if (options.filter) {
    paths = paths.filter((path) => {
      const args = wrangle.pathFilter(path, dir);
      return options.filter ? options.filter(args) : true;
    });
  }

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
    const glob = Fs.glob(dir, { includeDirs });
    const paths = (await glob.find('**')).map((m) => m.path);
    return paths;
  },

  pathFilter(path: t.StringPath, base: t.StringDir): t.FileMapBundleFilterArgs {
    return {
      path: path.slice(base.length + 1),
      ext: Path.extname(path),
      contentType: Data.contentType.fromPath(path),
    };
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

  options(input?: t.FileMapBundleOptions | t.FileMapBundleFilter) {
    if (!input) return {};
    if (typeof input === 'function') return { filter: input };
    return input;
  },
} as const;
