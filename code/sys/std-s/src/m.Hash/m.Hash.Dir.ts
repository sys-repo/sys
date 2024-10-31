import { Hash } from '@sys/std/hash';
import { type t, Err, Fs } from './common.ts';

export const Dir: t.HashDirLib = {
  async compute(base, options = {}) {
    const { filter } = wrangle.options(options);
    const exists = await Fs.exists(base);
    const res: t.HashDir = { exists, base, hash: '', files: {} };

    if (!exists) {
      res.error = Err.std('Directory does not exist.');
    } else {
      const isDir = await Fs.Is.dir(base);
      if (!isDir) {
        res.error = Err.std('Path is not a directory.');
      } else {
        const builder = Hash.composite();
        const paths = (await Fs.glob(base).find('**'))
          .filter((m) => m.isFile)
          .map((m) => m.path.substring(base.length + 1))
          .map((m) => `./${m}`)
          .filter((m) => (filter ? filter(m) : true));
        for (const path of paths) {
          builder.add(path, await Deno.readFile(Fs.join(base, path)));
        }
        res.files = builder.parts;
        res.hash = builder.digest;
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
