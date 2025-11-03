import { describe, expect, it } from '../../-test.ts';
import { CrdtTools } from '../mod.ts';

describe(`CLI: CrdtTools`, () => {
  it('API', async () => {
    const m = await import('@sys/tools/crdt');
    expect(m.CrdtTools).to.equal(CrdtTools);
  });
});
