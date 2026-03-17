import { describe, expect, it } from '../../../-test.ts';
import { DenoEntry } from '../mod.ts';

describe(`DenoEntry`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-deno/cloud');
    expect(m.DenoEntry).to.equal(DenoEntry);
  });
});
