import { describe, expect, it } from '../../../-test.ts';
import { DenoVersion } from '../mod.ts';

describe(`DenoVersion`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-deno/runtime');
    expect(m.DenoVersion).to.equal(DenoVersion);
  });
});
