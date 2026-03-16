import { describe, expect, Fs, it } from '../../../-test.ts';
import { DenoDeploy } from '../mod.ts';

describe('DenoDeploy', () => {
  it('API', async () => {
    const m = await import('@sys/driver-deno/cloud');
    expect(m.DenoDeploy).to.equal(DenoDeploy);
  });

  it('package deno.json does not contain operator deploy config', async () => {
    const path = Fs.Path.fromFileUrl(new URL('../../../../deno.json', import.meta.url));
    const res = await Fs.readJson<Record<string, unknown>>(path);
    expect(res.ok).to.eql(true);
    expect('deploy' in (res.data ?? {})).to.eql(false);
  });
});
