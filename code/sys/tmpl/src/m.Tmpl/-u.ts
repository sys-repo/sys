import { type t, Fs, slug } from './common.ts';

export const SAMPLE = {
  init(options: { source?: t.StringDir; slug?: boolean } = {}) {
    const source = Fs.resolve(options.source ?? './src/-test/-sample');
    const target = Fs.resolve(`./.tmp/tests/m.Tmpl`, options.slug ?? true ? slug() : '');
    const exists = (dir: t.StringDir, path: string[]) => Fs.exists(Fs.join(dir, ...path));
    return {
      source,
      target,
      ls: {
        source: () => Fs.ls(source),
        target: () => Fs.ls(target),
      },
      exists: {
        source: (...path: string[]) => exists(source, path),
        target: (...path: string[]) => exists(target, path),
      },
    } as const;
  },
} as const;
