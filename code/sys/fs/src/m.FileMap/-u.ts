import { Fs, slug } from './common.ts';

export const Sample = {
  source: {
    dir: Fs.resolve('./src/-test/-sample-4'),
    ls: (trimCwd = false) => Fs.ls(Sample.source.dir, { trimCwd }),
  },

  init(options: { slug?: boolean } = {}) {
    const target = Fs.join(`./.tmp/test/Fs.FileMap`, options.slug ?? true ? slug() : '');
    return {
      target,
      ls: () => Fs.ls(target, {}),
    } as const;
  },
} as const;
