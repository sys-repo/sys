import { type t, Err, Fs, Hash, CompositeHash } from './common.ts';

/**
 * Compute a `CompositeHash` for the given directory.
 */
export const compute: t.DirHashLib['compute'] = async (dir, options = {}) => {
  dir = Fs.resolve(dir);
  const { filter } = wrangle.computeOptions(options);
  const errors = Err.errors();
  const exists = await Fs.exists(dir);
  const builder = CompositeHash.builder();
  const res: t.DirHash = { exists, dir, hash: builder.toObject() };

  if (!exists) {
    errors.push(Err.std('Directory does not exist.'));
  } else {
    const isDir = await Fs.Is.dir(dir);
    if (!isDir) {
      errors.push(Err.std('Path is not a directory.'));
    } else {
      const paths = (await Fs.glob(dir).find('**'))
        .filter((m) => m.isFile)
        .filter((m) => (filter ? filter(m.path) : true))
        .map((m) => m.path.substring(dir.length + 1));
      for (const path of paths) {
        const file = await Fs.read(Fs.join(dir, path));
        if (file.exists) builder.add(path, file.data);
      }
      res.hash = builder.toObject();
    }
  }

  res.error = errors.toError();
  return res;
};

/**
 * Helpers
 */
const wrangle = {
  computeOptions(input?: t.DirHashComputeOptions | t.FsPathFilter) {
    if (!input) return {};
    if (typeof input === 'function') return { filter: input };
    return input;
  },
} as const;
