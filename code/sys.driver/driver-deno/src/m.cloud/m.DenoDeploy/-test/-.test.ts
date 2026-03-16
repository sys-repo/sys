import { describe, expect, Fs, Is, it } from '../../../-test.ts';
import { DenoDeploy } from '../mod.ts';

describe('DenoDeploy', () => {
  it('API', () => {
    expect(Is.func(DenoDeploy.stage)).to.eql(true);
    expect(Is.func(DenoDeploy.deploy)).to.eql(true);
  });

  it('package deno.json does not contain operator deploy config', async () => {
    const denoJsonPath = Fs.Path.fromFileUrl(new URL('../../../../deno.json', import.meta.url));
    const res = await Fs.readJson<Record<string, unknown>>(denoJsonPath);
    expect(res.ok).to.eql(true);
    expect('deploy' in (res.data ?? {})).to.eql(false);
  });
});
