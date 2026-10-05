import { type t, CompositeHash, Err, Fs } from './common.ts';

/**
 * Compute a `CompositeHash` for the given directory.
 */
export const compute: t.Dir.Hash.Compute.Method = async (dir, options = {}) => {
  dir = Fs.resolve(dir);
  const { filter, onProgress } = wrangle.computeOptions(options);
  const errors = Err.errors();
  const exists = await Fs.exists(dir);
  const builder = CompositeHash.builder();

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
      for (const [index, path] of paths.entries()) {
        if (onProgress) await onProgress({ dir, path, current: index + 1, total: paths.length });
        const file = await Fs.read(Fs.join(dir, path));
        if (file.exists) builder.add(path, file.data);
      }
    }
  }

  return { exists, dir, hash: builder.toObject(), error: errors.toError() };
};

/**
 * Helpers
 */
const wrangle = {
  computeOptions(input?: t.Dir.Hash.Compute.Options | t.Fs.Path.Filter) {
    if (!input) return {};
    if (typeof input === 'function') return { filter: input };
    return input;
  },
} as const;
