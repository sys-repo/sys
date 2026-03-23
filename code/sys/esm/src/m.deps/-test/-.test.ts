import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Deps } from '../mod.ts';

describe(`@sys/esm/deps`, () => {
  it('API', async () => {
    const m = await import('@sys/esm/deps');
    expect(m.Deps).to.equal(Deps);
  });
});
