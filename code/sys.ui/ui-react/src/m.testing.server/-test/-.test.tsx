import { describe, expect, it } from '../../-test.ts';
import { DomMock, Testing, TestReact } from '../mod.ts';

describe('React Testing (Server)', () => {
  it('API', async () => {
    const m = await import('@sys/ui-react/testing/server');
    expect(m.TestReact).to.equal(TestReact);
    expect(m.Testing).to.equal(Testing);
    expect(m.DomMock).to.equal(DomMock);
  });
});
