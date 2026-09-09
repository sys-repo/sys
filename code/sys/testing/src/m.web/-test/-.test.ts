import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Fetch } from '../m.Fetch/mod.ts';
import { Property } from '../m.Property/mod.ts';
import { WebSocket } from '../m.WebSocket/mod.ts';
import { WebFixture } from '../mod.ts';

describe('WebFixture', () => {
  it('public API → composes one canonical owner graph', async () => {
    const m = await import('@sys/testing/web');
    expect(m.WebFixture).to.equal(WebFixture);
    expect(WebFixture.Fetch).to.equal(Fetch);
    expect(WebFixture.Property).to.equal(Property);
    expect(WebFixture.WebSocket).to.equal(WebSocket);
    expectTypeOf(WebFixture).toEqualTypeOf<t.WebFixture.Lib>();
  });
});
