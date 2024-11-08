import { slug, Testing } from '../-test.ts';
import { Fs } from './common.ts';

export const SAMPLE = {
  PATH: { sample: Fs.resolve('./src/-test/vitepress.sample-1') },

  async setup(options: { slug?: boolean } = {}) {
    const port = Testing.randomPort();
    let path = `./.tmp/docs`;
    if (options.slug ?? true) path = Fs.join(path, slug());
    await Fs.copy(SAMPLE.PATH.sample, Fs.resolve(path), { force: true });
    return { path, port };
  },
};
