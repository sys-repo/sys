import { act, renderHook } from '../u.renderHook.ts';
import { describe, expect, it } from '../../-test.ts';
import { DomMock, Testing, TestReact } from '../mod.ts';

describe('React Testing (Server)', { sanitizeOps: false, sanitizeResources: false }, () => {
  it('API', async () => {
    const m = await import('@sys/ui-react/testing/server');
    expect(m.TestReact).to.equal(TestReact);
    expect(m.Testing).to.equal(Testing);
    expect(m.DomMock).to.equal(DomMock);

    expect(m.renderHook).to.equal(renderHook);
    expect(m.act).to.equal(act);
    expect(TestReact.renderHook).to.equal(renderHook);
    expect(TestReact.act).to.equal(act);
  });
});
