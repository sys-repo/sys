import { describe, expect, it } from '../../-test.ts';
import { ClipboardTools } from '../mod.ts';

describe(`CLI: Clipboard Tools`, () => {
  it('API', async () => {
    const cp = await import('@sys/tools/cp');
    const copy = await import('@sys/tools/copy');
    expect(cp.ClipboardTools).to.equal(ClipboardTools);
    expect(copy.ClipboardTools).to.equal(ClipboardTools);
  });
});
