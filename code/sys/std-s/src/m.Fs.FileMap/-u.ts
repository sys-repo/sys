import { Fs, slug } from './common.ts';

export const Sample = {
  source: {
    dir: 'src/m.Fs.FileMap/-sample',
    ls: () => Fs.ls(Sample.source.dir),
  },

  async init(options: { slug?: boolean } = {}) {
    const target = Fs.join(`./.tmp/tests/m.FileMap`, options.slug ?? true ? slug() : '');
    return {
      target,
      ls: () => Fs.ls(target),
    } as const;
  },
} as const;
