import { describe, expect, it } from '../../-test.ts';
import { LogoCanvas, LogoWordmark } from '../mod.ts';

describe(`Standard UI Libs`, () => {
  it('API', async () => {
    const m = await import('@tdb/slc-std/ui');
    expect(m.LogoCanvas).to.equal(LogoCanvas);
    expect(m.LogoWordmark).to.equal(LogoWordmark);
  });
});
