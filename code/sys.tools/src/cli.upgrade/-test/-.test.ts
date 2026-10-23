import { describe, expect, it } from '../../-test.ts';
import { D } from '../common.ts';
import { UpgradeTools } from '../mod.ts';

describe(D.tool.name, () => {
  it('API', async () => {
    const m = await import('@sys/tools/upgrade');
    expect(m.UpgradeTools).to.equal(UpgradeTools);
  });
});
