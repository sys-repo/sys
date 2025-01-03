import { slug } from '../-test.ts';
import { Fs } from './common.ts';

export const Sample = {
  dir: Fs.resolve('./src/-test/-sample-3'),

  /**
   * Initialize a new sample directory to test against.
   */
  async init(options: { slug?: boolean } = {}) {
    let dir = './.tmp/test/m.Dir';
    if (options.slug ?? true) dir += `/${slug()}`;

    const file = {
      main: {
        path: Fs.join(dir, 'main.ts'),
        exists: () => Fs.exists(file.main.path),
        delete: () => Fs.remove(file.main.path),
      },
    } as const;

    await Fs.copyDir(Sample.dir, dir);
    return {
      dir,
      file,
      async ls() {
        return Fs.ls(dir, { includeDirs: false });
      },
    } as const;
  },
} as const;
