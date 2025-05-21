import { Fs, slug } from '../../-test.ts';

export const SAMPLE = {
  async setup() {
    const root = Fs.resolve('./.tmp/test');
    const instance = Fs.join(root, slug());
    const dir = { root, instance } as const;
    await Fs.ensureDir(dir.instance);
    return { dir } as const;
  },
};
