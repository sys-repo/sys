import { type t, Fs, slug } from './common.ts';

export const SAMPLE = {
  init(options: { source?: t.StringDir; slug?: boolean } = {}) {
    const source = Fs.resolve(options.source ?? './src/m.Tmpl/-sample');

    let target = `./.tmp/Tmpl.tests`;
    if (options.slug ?? true) target = Fs.join(target, slug());
    target = Fs.resolve(target);

    const ls = async (dir: t.StringDir) => {
      const files = await Fs.glob(dir).find('**');
      return files.filter((m) => m.path !== dir).map((m) => m.path);
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
