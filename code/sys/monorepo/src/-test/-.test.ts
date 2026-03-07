import { describe, expect, it } from '../-test.ts';
import { MonorepoCi } from '../m.ci/mod.ts';
import { Monorepo } from '../mod.ts';

describe(`@sys/monorepo/ci`, () => {
  it('API', async () => {
    const m = await import('@sys/monorepo');
    expect(m.Monorepo).to.equal(Monorepo);
    expect(m.Monorepo.Ci).to.equal(MonorepoCi);
  });
});
