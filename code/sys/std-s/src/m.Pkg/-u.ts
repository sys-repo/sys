import { type t, Fs, pkg } from '../-test.ts';
import { Pkg } from './mod.ts';

export const SAMPLE_PATH = {
  dir: Fs.resolve('./src/-test/-sample-dist'),
  entry: './pkg/-entry.BEgRUrsO.js',
  get filepath() {
    return Fs.join(SAMPLE_PATH.dir, 'dist.json');
  },
};
export const SAMPLE_FILE = {
  dist: {
    exists: () => Fs.exists(SAMPLE_PATH.filepath),
    delete: () => Fs.remove(SAMPLE_PATH.filepath),
    async reset() {
      await SAMPLE_FILE.dist.delete();
    },
    async ensure() {
      if (await SAMPLE_FILE.dist.exists()) return;
      const { dir, entry } = SAMPLE_PATH;
      await Pkg.Dist.compute({ dir, pkg, entry, save: true });
    },
    async copyTo(target: t.StringDir) {
      await Fs.copyDir(SAMPLE_PATH.dir, target);
    },
  },
} as const;
