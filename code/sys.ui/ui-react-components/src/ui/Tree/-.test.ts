import { describe, expect, it } from '../../-test.ts';
import { Tree } from './mod.ts';

describe('Tree', () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-components');
    expect(m.Tree).to.equal(Tree);
    expect(Tree.Index).to.equal(m.IndexTree);
  });
});
