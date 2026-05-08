import { describe, expect, it } from '../../-test.ts';
import { TextBlock } from '../mod.ts';

describe('TextBlock', () => {
  it('API', async () => {
    const m = await import('@sys/text/block');
    expect(m.TextBlock).to.equal(TextBlock);
  });
});
