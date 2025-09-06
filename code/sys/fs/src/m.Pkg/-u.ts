import { pkg } from '../-test.ts';
import { Fs } from './common.ts';
import { Pkg } from './mod.ts';

export const Sample = {
  dir: Fs.resolve('./src/-test/-sample-5'),

  /**
   * Initialize a new sample directory to test against.
   */
  async init(prefix = 'Fs.Pkg.') {
    const dir = (await Fs.makeTempDir({ prefix })).absolute;
    const path = {
      dir,
      entry: './pkg/-entry.BEgRUrsO.js',
      get filepath() {
        return Fs.join(dir, 'dist.json');
      },
      async ls() {
        const glob = Fs.glob(dir, { includeDirs: false });
        return (await glob.find('**')).map((m) => m.path);
      },
    } as const;

    const file = {
      dist: {
        exists: () => Fs.exists(path.filepath),
        delete: () => Fs.remove(path.filepath),
        async reset() {
          await file.dist.delete();
        },
        async ensure() {
          if (await file.dist.exists()) return;
          const { dir, entry } = path;
          const save = true;
          await Pkg.Dist.compute({ dir, pkg, entry, save });
        },
      },
    } as const;

    await Fs.copyDir(Sample.dir, dir);
    return { path, file } as const;
  },
} as const;
