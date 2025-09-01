import { type t, Fs } from './common.ts';

export const Sample = {
  source: {
    dir: Fs.resolve('./src/-test/-sample-4'),
    ls: (trimCwd = false) => Fs.ls(Sample.source.dir, { trimCwd }),
  },

  async init(prefix = 'Fs.FileMap.') {
    const target = (await Fs.makeTempDir({ prefix })).absolute;
    const ls = async (dir: t.StringDir, trim = false) => {
      let paths = await Fs.ls(dir);
      if (trim) paths = paths.map((p) => p.slice(dir.length + 1));
      return paths;
    };

    return {
      target,
      ls: {
        source: (trim = false) => ls(Sample.source.dir, trim),
        target: (trim = false) => ls(target, trim),
      },
    } as const;
  },
} as const;
