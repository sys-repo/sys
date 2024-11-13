import { type t, slug, Testing } from '../-test.ts';
import { Fs } from './common.ts';

export const SAMPLE = {
  PATH: {
    sample: Fs.resolve('./src/-test/vitepress.sample-1'),
  },

  createPkg(): t.Pkg {
    return { name: `@sample/${slug()}`, version: '0.1.2' };
  },

  async init(options: { slug?: boolean } = {}) {
    const port = Testing.randomPort();
    let path = `./.tmp/docs.tests`;
    if (options.slug ?? true) path = Fs.join(path, slug());

    await Fs.copy(SAMPLE.PATH.sample, Fs.resolve(path), { force: true });

    const inDir = Fs.resolve(path);
    const outDir = Fs.resolve(path, '.vitepress/dist');

    return {
      path,
      port,
      inDir,
      outDir,
      async ls() {
        const ls = await Fs.glob(inDir).find('**');
        return ls.map((m) => m.path);
      },
    } as const;
  },
} as const;
