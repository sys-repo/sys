import { describe, expect, it } from './common.ts';
import { SAMPLE } from './mod.ts';

describe('SAMPLE.fs', () => {
  it('preserves the provided sample name in the temp-dir prefix', async () => {
    const fs = await SAMPLE.fs('Jsr.sample-name');
    const basename = fs.dir.split('/').at(-1) ?? '';
    expect(basename.startsWith('Jsr.sample-name-')).to.eql(true);
    expect('create' in fs).to.eql(false);
  });
});
