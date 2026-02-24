import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Signer } from '../mod.ts';

describe(`signer (core)`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-signer');
    const core = await import('@sys/driver-signer/core');

    expect(m.Signer).to.equal(Signer);
    expect(core.Signer).to.equal(m.Signer);
  });
});
