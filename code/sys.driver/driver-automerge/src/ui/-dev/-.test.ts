import { describe, expect, it } from '../../-test.ts';
import { CrdtObjectView, Dev } from './mod.ts';

describe('Crdt: Layout', () => {
  it('API', async () => {
    const m = await import('@sys/driver-automerge/web/ui');
    expect(m.Crdt.UI.Dev).to.equal(Dev);
    expect(m.Dev).to.equal(Dev);
    expect(m.Dev.ObjectView).to.equal(CrdtObjectView);
  });
});
