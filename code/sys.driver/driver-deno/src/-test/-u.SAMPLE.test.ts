import { describe, expect, it, SAMPLE } from './mod.ts';

describe('SAMPLE.fs', () => {
  it('preserves the provided sample name in the temp-dir prefix', async () => {
    const fs = await SAMPLE.fs('Deno.sample-name');
    const basename = fs.dir.split('/').at(-1) ?? '';
    expect(basename.startsWith('Deno.sample-name-')).to.eql(true);
    expect('create' in fs).to.eql(false);
  });
});
