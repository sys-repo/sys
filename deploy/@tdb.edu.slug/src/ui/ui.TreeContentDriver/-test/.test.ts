import { describe, expect, it } from '../../../-test.ts';

import { TreeContentDriver } from '../mod.ts';
import { TreeContentDriver as UI } from '../ui.tsx';

describe('TreeContentDriver', () => {
  it('API', async () => {
    expect(TreeContentDriver.UI).to.equal(UI);
  });
});
