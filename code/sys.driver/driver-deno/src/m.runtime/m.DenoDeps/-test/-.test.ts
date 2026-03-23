import { describe, expect, it } from '../../../-test.ts';
import { Fmt } from '../m.Fmt.ts';
import { DenoDeps } from '../mod.ts';

describe('DenoDeps', () => {
  it('API', async () => {
    const m = await import('@sys/driver-deno/runtime');
    expect(m.DenoDeps).to.equal(DenoDeps);
    expect(DenoDeps.Fmt).to.equal(Fmt);
  });
});
