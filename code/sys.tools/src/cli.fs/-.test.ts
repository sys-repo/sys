import { describe, expect, it } from '../-test.ts';
import { D } from './common.ts';
import { FsTools } from './mod.ts';

describe(D.toolname, () => {
  it('API', async () => {
    const m = await import('@sys/tools/fs');
    expect(m.FsTools).to.equal(FsTools);
  });
});
