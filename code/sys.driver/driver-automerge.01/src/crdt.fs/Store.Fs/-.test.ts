import { describe, expect, it } from '../../-test.ts';
import { SAMPLE } from './-u.ts';
import { Is } from './common.ts';
import { FsStore } from './mod.ts';

describe('Store.Fs', () => {
  it('init', async () => {
    const sample = await SAMPLE.setup();
    const dir = sample.dir.instance;
    const store = FsStore.init({ dir });
    expect(Is.fsStore(store)).to.eql(true);
    expect(store.dir).to.eql(dir);
  });
});
