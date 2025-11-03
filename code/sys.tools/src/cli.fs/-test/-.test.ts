import { describe, expect, it } from '../../-test.ts';
import { FsTools } from '../mod.ts';

describe(`CLI: CrdtTools`, () => {
  it('API', async () => {
    const m = await import('@sys/tools/fs');
    expect(m.FsTools).to.equal(FsTools);
  });
});
