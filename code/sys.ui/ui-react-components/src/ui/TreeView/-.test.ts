import { describe, expect, it } from '../../-test.ts';
import { TreeView } from './mod.ts';

describe('TreeView', () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-components');
    expect(m.TreeView).to.equal(TreeView);
    expect(TreeView.Index).to.equal(m.IndexTreeView);
  });
});
