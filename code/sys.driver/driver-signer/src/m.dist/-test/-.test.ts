import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { DistSigner } from '../mod.ts';

describe(`DistSigner`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-signer/dist');
    expect(m.DistSigner).to.equal(DistSigner);
  });
});
