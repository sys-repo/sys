import { describe, expect, it } from '../../-test.ts';
import { Clipboard } from '../mod.ts';

describe(`Clipboard Tools`, () => {
  it('API', async () => {
    const m = await import('@sys/tools/cp');
    expect(m.Clipboard).to.equal(Clipboard);
  });
});
