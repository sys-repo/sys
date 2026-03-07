import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { MonorepoCi } from '../mod.ts';

describe(`@sys/monorepo/ci`, () => {
  it('API', async () => {
    const m = await import('@sys/monorepo/ci');
    expect(m.MonorepoCi).to.equal(MonorepoCi);
  });
});
