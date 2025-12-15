import { describe, expect, it } from '../-test.ts';
import { D } from './common.ts';
import { UpdateTools } from './mod.ts';

describe(D.tool.name, () => {
  it('API', async () => {
    const m = await import('@sys/tools/update');
    expect(m.UpdateTools).to.equal(UpdateTools);
  });
});
