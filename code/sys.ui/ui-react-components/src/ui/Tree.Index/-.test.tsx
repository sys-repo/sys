import { describe, expect, it } from '../../-test.ts';
import { IndexTreeItem } from '../Tree.Index.Item/mod.ts';

import { IndexTree } from './mod.ts';
import { IndexTree as View } from './ui.tsx';

describe('Tree.Index', () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-components');
    expect(m.IndexTree).to.equal(IndexTree);
    expect(IndexTree.View).to.equal(View);
    expect(IndexTree.Item.View).to.equal(IndexTreeItem);
  });
});
