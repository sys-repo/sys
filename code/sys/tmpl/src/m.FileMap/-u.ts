import { type t, Fs, slug } from './common.ts';

export const Sample = {
  source: {
    dir: 'src/m.FileMap/-sample',
    ls: () => ls(Sample.source.dir),
  },

  async init(options: { slug?: boolean } = {}) {
    const target = Fs.join(`./.tmp/tests/m.FileMap`, options.slug ?? true ? slug() : '');
    return {
      target,
      ls: () => ls(target),
    } as const;
  },
} as const;

/**
 * Helpers
 */
const ls = async (dir: t.StringDir) => {
  const files = await Fs.glob(dir, { includeDirs: false }).find('**');
  return files.map((m) => m.path);
};
