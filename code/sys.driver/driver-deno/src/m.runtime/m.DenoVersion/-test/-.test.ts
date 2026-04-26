import { describe, expect, it, Semver } from '../../../-test.ts';
import { DenoVersion } from '../mod.ts';

describe(`DenoVersion`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-deno/runtime');
    expect(m.DenoVersion).to.eql(DenoVersion);
  });

  it('resolves the local Deno runtime version', async () => {
    const res = await DenoVersion.Current.get();
    expect(res.ok).to.eql(true);
    if (!res.ok) return;
    expect(Semver.Is.valid(res.data.version)).to.eql(true);
    expect(res.data.output.cmd).to.eql('deno');
  });

  it('detects the Deno runtime upgrade authority', async () => {
    const res = await DenoVersion.Authority.detect();
    expect(res.ok).to.eql(true);
    if (!res.ok) return;
    expect(['deno-upgrade', 'brew', 'unknown']).to.contain(res.data.kind);
  });
});
