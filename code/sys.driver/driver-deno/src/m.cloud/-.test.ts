import { describe, expect, it } from '../-test.ts';
import { DenoApp, DenoDeploy, DenoEntry } from './mod.ts';

describe(`@sys/driver-deno/cloud`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-deno/cloud');
    expect(m.DenoDeploy).to.equal(DenoDeploy);
    expect(m.DenoEntry).to.equal(DenoEntry);
    expect(m.DenoApp).to.equal(DenoApp);
  });
});
