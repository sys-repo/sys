import type { DomMock as DomMockContract } from '@sys/std/t';
import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { DomMock } from '../mod.ts';

describe('Mock (DOM)', () => {
  it('API', async () => {
    const m = await import('@sys/std/testing/server/dom');

    expect(m.DomMock).to.equal(DomMock);
    expectTypeOf(m.DomMock).toEqualTypeOf<DomMockContract.Lib>();
    expect(m.DomMock.Mouse).to.equal(DomMock.Mouse);
    expect(Object.isFrozen(m.DomMock)).to.eql(true);
  });
});
