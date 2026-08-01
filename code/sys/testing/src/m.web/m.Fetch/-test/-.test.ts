import { describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { Fetch } from '../mod.ts';

describe('WebFixture.Fetch', () => {
  it('API', async () => {
    const m = await import('@sys/testing/web');
    expect(m.WebFixture.Fetch).to.equal(Fetch);
    expectTypeOf(Fetch).toEqualTypeOf<t.WebFixtureFetch.Lib>();
    expectTypeOf(m.WebFixture.Fetch).toEqualTypeOf<t.WebFixture.Fetch.Lib>();
  });
});
