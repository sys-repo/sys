import { describe, expect, it } from '../../-test.ts';
import { DomMock } from '../mod.ts';

describe('Mock (DOM)', () => {
  it('API', async () => {
    const m = await import('@sys/std/testing/server');
    expect(m.DomMock).to.equal(DomMock);
    expect(m.DomMock.Mouse).to.equal(DomMock.Mouse);
  });
});
