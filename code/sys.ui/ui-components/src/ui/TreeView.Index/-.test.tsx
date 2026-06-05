import { describe, expect, it } from '../../-test.ts';
import { IndexTreeViewItem } from '../TreeView.Index.Item/mod.ts';

import { IndexTreeView } from './mod.ts';
import { IndexTreeView as UI } from './ui.tsx';

describe('TreeView.Index', () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-components/tree-view/index');
    expect(m.IndexTreeView).to.equal(IndexTreeView);
    expect(IndexTreeView.UI).to.equal(UI);
    expect(IndexTreeView.Item).to.equal(IndexTreeViewItem);
  });
});
