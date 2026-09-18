import { describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { Fetch } from '../mod.ts';

describe('WebFixture.Fetch', () => {
  it('public API → exposes the canonical Fetch fixture owner', async () => {
    const m = await import('@sys/testing/web');
    expect(m.WebFixture.Fetch).to.equal(Fetch);
    expectTypeOf(Fetch).toEqualTypeOf<t.WebFixture.Fetch.Lib>();
  });
});
