import { type t, Fs, slug } from './common.ts';

export const SAMPLE = {
  init(options: { source?: t.StringDir; slug?: boolean } = {}) {
    const source = Fs.resolve(options.source ?? './src/-tmpl-2/-sample.1');

    let target = `./.tmp/Tmpl.tests`;
    if (options.slug ?? true) target = Fs.join(target, slug());
    target = Fs.resolve(target);

    return { source, target } as const;
  },
} as const;
