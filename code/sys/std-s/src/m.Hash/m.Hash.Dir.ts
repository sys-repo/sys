import { Hash } from '@sys/std/hash';
import { type t, Err, Fs } from './common.ts';

export const Dir: t.HashDirLib = {
  async compute(dir, options = {}) {
    const { filter } = wrangle.options(options);
    const exists = await Fs.exists(dir);
    const builder = Hash.composite();
    const res: t.HashDir = { exists, dir, hash: builder.toObject() };

    if (!exists) {
      res.error = Err.std('Directory does not exist.');
    } else {
      const isDir = await Fs.Is.dir(dir);
      if (!isDir) {
        res.error = Err.std('Path is not a directory.');
      } else {
        const paths = (await Fs.glob(dir).find('**'))
          .filter((m) => m.isFile)
          .map((m) => m.path.substring(dir.length + 1))
          .map((m) => `./${m}`)
          .filter((m) => (filter ? filter(m) : true));
        for (const path of paths) {
          builder.add(path, await Deno.readFile(Fs.join(dir, path)));
        }
        res.hash = builder.toObject();
      }
    }

    return res;
  },
};

/**
 * Helpers
 */
const wrangle = {
  options(input?: t.HashDirComputeOptions | t.HashDirFilter) {
    if (!input) return {};
    if (typeof input === 'function') return { filter: input };
    return input;
  },
} as const;
