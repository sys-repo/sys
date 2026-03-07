import { describe, expect, it } from '../../../-test.ts';

import { SlugClient } from '../common.ts';
import { TreeHost } from '../mod.ts';

describe('TreeSplit', () => {
  it('API', async () => {
    const m = await import('@tdb/edu-slug/ui');
    expect(m.TreeHost).to.equal(TreeHost);
    expect(TreeHost.Data.Client).to.equal(SlugClient);
  });
});
