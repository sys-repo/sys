import { Fs, slug } from './common.ts';

export const Sample = {
  source: {
    dir: 'src/m.FileMap/-sample',
    ls: () => Fs.ls(Sample.source.dir),
  },

  init(options: { slug?: boolean } = {}) {
    const target = Fs.join(`./.tmp/test/Fs.FileMap`, options.slug ?? true ? slug() : '');
    return {
      target,
      ls: () => Fs.ls(target),
    } as const;
  },
} as const;
