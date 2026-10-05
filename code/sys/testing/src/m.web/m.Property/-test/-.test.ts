import { describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { Property } from '../mod.ts';

describe('WebFixture.Property', () => {
  it('public API → exposes the canonical Property fixture owner', async () => {
    const m = await import('@sys/testing/web');
    expect(m.WebFixture.Property).to.equal(Property);
    expectTypeOf(Property).toEqualTypeOf<t.WebFixture.Property.Lib>();
  });

  it('cleanup error guard → rejects caller AggregateErrors', () => {
    expect(Property.isCleanupError(new AggregateError([]))).to.eql(false);
    expectTypeOf(Property.isCleanupError).toEqualTypeOf<t.WebFixture.Property.IsCleanupError>();
  });
});
