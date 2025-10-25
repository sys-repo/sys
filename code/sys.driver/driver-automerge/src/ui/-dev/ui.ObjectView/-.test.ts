import { describe, expect, it } from '../../../-test.ts';
import { SignalsObjectView } from '../mod.ts';

describe('Crdt: Layout', () => {
  it('API', async () => {
    const m = await import('@sys/driver-automerge/web/ui');
    expect(m.Layout.Dev.SignalsObjectView).to.equal(SignalsObjectView);
  });
});
