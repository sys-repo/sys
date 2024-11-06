import { describe, expect, Fs, it, slug } from '../../-test.ts';
import { Is } from './common.ts';
import { FsStore } from './mod.ts';

export const SAMPLE = {
  async setup() {
    const root = Fs.resolve('./.tmp/test');
    const instance = Fs.join(root, slug());
    const dir = { root, instance } as const;
    await Fs.ensureDir(dir.instance);
    return { dir } as const;
  },
};

describe('Store.Fs', () => {
  it('init', async () => {
    const sample = await SAMPLE.setup();
    const dir = sample.dir.instance;
    const store = FsStore.init({ dir });
    expect(Is.fsStore(store)).to.eql(true);
    expect(store.dir).to.eql(dir);
  });
});
