import { describe, expect, it } from '../-test.ts';
import { D } from './common.ts';
import { ClipboardTools } from './mod.ts';

describe(D.tool.name, () => {
  it('API', async () => {
    const cp = await import('@sys/tools/cp');
    const copy = await import('@sys/tools/copy');
    expect(cp.ClipboardTools).to.equal(ClipboardTools);
    expect(copy.ClipboardTools).to.equal(ClipboardTools);
  });
});
