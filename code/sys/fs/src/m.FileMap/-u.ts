import { Fs } from './common.ts';

export const Sample = {
  source: {
    dir: Fs.resolve('./src/-test/-sample-4'),
    ls: (trimCwd = false) => Fs.ls(Sample.source.dir, { trimCwd }),
  },

  async init(prefix = 'Fs.FileMap.') {
    const dir = await Fs.makeTempDir({ prefix });
    return {
      target: dir.absolute,
      ls: (trimCwd = false) => Fs.ls(dir.absolute, { trimCwd }),
    } as const;
  },
} as const;
