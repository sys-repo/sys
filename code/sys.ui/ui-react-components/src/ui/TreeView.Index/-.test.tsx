import { describe, expect, it } from '../../-test.ts';
import { IndexTreeViewItem } from '../TreeView.Index.Item/mod.ts';

import { IndexTreeView } from './mod.ts';
import { IndexTreeView as View } from './ui.tsx';

describe('TreeView.Index', () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-components');
    expect(m.IndexTreeView).to.equal(IndexTreeView);
    expect(IndexTreeView.View).to.equal(View);
    expect(IndexTreeView.Item.View).to.equal(IndexTreeViewItem);
  });
});
