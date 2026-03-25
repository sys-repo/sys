import { describe, expect, it } from '../../../-test.ts';
import { DenoApp } from '../mod.ts';

describe(`DenoApp`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-deno/cloud');
    expect(m.DenoApp).to.equal(DenoApp);
    expect(m.DenoDeploy.App).to.equal(DenoApp);
    expect(m.DenoApp.create).to.equal(DenoApp.create);
    expect(typeof m.DenoApp.create).to.equal('function');
  });
});
