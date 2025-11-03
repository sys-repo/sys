import { describe, expect, it } from '../-test.ts';
import { D } from './common.ts';
import { CrdtTools } from './mod.ts';

describe(D.toolname, () => {
  it('API', async () => {
    const m = await import('@sys/tools/crdt');
    expect(m.CrdtTools).to.equal(CrdtTools);
  });
});
