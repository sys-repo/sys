import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { WebFixture } from '../mod.ts';

describe('WebFixture', () => {
  it('API', async () => {
    const m = await import('@sys/testing/web');
    expect(m.WebFixture).to.equal(WebFixture);
    expect(m.WebFixture.Fetch).to.equal(WebFixture.Fetch);
    expect(m.WebFixture.WebSocket).to.equal(WebFixture.WebSocket);
    expectTypeOf(WebFixture).toEqualTypeOf<t.WebFixture.Lib>();
    expectTypeOf(WebFixture.Fetch).toEqualTypeOf<t.WebFixture.Fetch.Lib>();
  });
});
