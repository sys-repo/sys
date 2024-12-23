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
    const glob = Fs.glob(dir);
    const paths = (await glob.find('**', { includeDirs })).map((m) => m.path);
    return paths.filter((path) => Is.supported.path(path));
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
    if (!(await Fs.exists(path))) return;

    const mime = Data.contentType.fromPath(path);
    if (!mime) return;

    const read = Is.contentType.string(mime) ? Deno.readTextFile : Deno.readFile;
    return Data.encode(mime, await read(path));
  },

  options(input?: t.FileMapBundleOptions | t.FileMapBundleFilter) {
    if (!input) return {};
    if (typeof input === 'function') return { filter: input };
    return input;
  },
} as const;
