import { describe, expect, it } from '../../-test.ts';
import { defaults } from './common.ts';
import { Layout } from './mod.ts';
import { Layout as View } from './ui.tsx';

describe('Crdt: Layout', () => {
  it('API', async () => {
    const m = await import('@sys/driver-automerge/web/ui');
    expect(m.Layout).to.equal(Layout);
    expect(m.Crdt.UI.Layout).to.equal(Layout);
    expect(m.Layout.View).to.equal(View);
  });

  it('API: defaults', () => {
    expect(Layout.defaults).to.equal(defaults);

    // Safe: new instances on each call.
    expect(Layout.defaults.header).to.not.equal(Layout.defaults.header);
    expect(Layout.defaults.sidebar).to.not.equal(Layout.defaults.sidebar);
    expect(Layout.defaults.cropmarks).to.not.equal(Layout.defaults.cropmarks);
  });
});
