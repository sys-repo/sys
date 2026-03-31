import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Update } from '../mod.ts';

describe(`Update`, () => {
  it('API', async () => {
    const m = await import('@sys/text');
    const mm = await import('@sys/text/update');
    expect(m.Update).to.equal(Update);
    expect(mm.Update).to.equal(Update);
  });
});
