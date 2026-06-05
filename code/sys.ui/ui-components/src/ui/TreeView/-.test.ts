import { describe, expect, it } from '../../-test.ts';
import { TreeView } from './mod.ts';

describe('TreeView', () => {
  it('API', async () => {
    const tree = await import('@sys/ui-components/react/tree-view');
    const index = await import('@sys/ui-components/react/tree-view/index');
    expect(tree.TreeView).to.equal(TreeView);
    expect(TreeView.Index).to.equal(index.IndexTreeView);
  });
});
