import { describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { WebSocket as WebSocketFixture } from '../mod.ts';

describe('WebFixture.WebSocket', () => {
  it('public API → exposes the canonical WebSocket fixture owner', async () => {
    const m = await import('@sys/testing/web');
    expect(m.WebFixture.WebSocket).to.equal(WebSocketFixture);
    expectTypeOf(WebSocketFixture).toEqualTypeOf<t.WebFixture.WebSocket.Lib>();
  });
});
