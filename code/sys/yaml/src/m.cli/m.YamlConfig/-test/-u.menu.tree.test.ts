import { describe, expect, it } from '../../../-test.ts';
import { c, Fmt } from '../common.ts';
import { withTree } from '../u.menu.tree.ts';

describe('YamlConfig.menu.tree', () => {
  it('builds labels and tree markers', () => {
    const res = withTree(['/tmp/alpha.yaml', '/tmp/beta.yaml'], '.yaml');
    expect(res).to.eql([
      {
        path: '/tmp/alpha.yaml',
        label: 'alpha',
        tree: c.gray(Fmt.Tree.branch(false)),
      },
      {
        path: '/tmp/beta.yaml',
        label: 'beta',
        tree: c.gray(Fmt.Tree.branch(true)),
      },
    ]);
  });
});
