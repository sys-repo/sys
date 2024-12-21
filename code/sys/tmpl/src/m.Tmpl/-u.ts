import { type t, Fs, slug } from './common.ts';

export const SAMPLE = {
  init(options: { source?: t.StringDir; slug?: boolean } = {}) {
    const source = Fs.resolve(options.source ?? './src/m.Tmpl/-sample');
    const target = Fs.resolve(`./.tmp/tests/m.Tmpl`, options.slug ?? true ? slug() : '');
    const ls = async (dir: t.StringDir) => {
      const files = await Fs.glob(dir, { includeDirs: false }).find('**');
      return files.map((m) => m.path);
    };

    const exists = (dir: t.StringDir, path: string[]) => {
      return Fs.exists(Fs.join(dir, ...path));
    };

    return {
      source,
      target,
      ls: {
        source: () => ls(source),
        target: () => ls(target),
      },
      exists: {
        source: (...path: string[]) => exists(source, path),
        target: (...path: string[]) => exists(target, path),
      },
    } as const;
  },
} as const;
