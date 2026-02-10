import { describe, expect, it } from '../../../-test.ts';

import { Data } from '../m.Data.ts';
import { TreeHost } from '../mod.ts';

describe('Layout.TreeHost', () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-components');
    expect(m.TreeHost).to.equal(TreeHost);
    expect(TreeHost.Data).to.equal(Data);
  });
});
