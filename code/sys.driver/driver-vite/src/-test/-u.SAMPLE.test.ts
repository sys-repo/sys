import { describe, expect, it, Path, SAMPLE } from './mod.ts';

describe('SAMPLE.fs', () => {
  it('preserves the provided sample name in the temp-dir prefix', async () => {
    const fs = await SAMPLE.fs('Vite.sample-name');
    expect(Path.basename(fs.dir).startsWith('Vite.sample-name-')).to.eql(true);
    expect('create' in fs).to.eql(false);
  });
});
