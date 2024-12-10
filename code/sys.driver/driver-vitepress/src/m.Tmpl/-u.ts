import { type t, Fs, slug } from './common.ts';

export const SAMPLE = {
  init(options: { source?: t.StringDir; slug?: boolean } = {}) {
    const source = Fs.resolve(options.source ?? './src/m.Tmpl/-sample-1');

    let target = `./.tmp/Tmpl.tests`;
    if (options.slug ?? true) target = Fs.join(target, slug());
    target = Fs.resolve(target);

    const ls = async (dir: t.StringDir) => {
      const ls = await Fs.glob(dir).find('**');
      return ls.filter((m) => m.path !== dir).map((m) => m.path);
    };

    return {
      source,
      target,
      ls: {
        source: () => ls(source),
        target: () => ls(target),
      },
    } as const;
  },
} as const;
