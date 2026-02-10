import { describe, expect, it } from '../../-test.ts';
import { CanvasLayout, LogoCanvas, LogoWordmark } from '../mod.ts';

describe(`Standard UI Libs`, () => {
  it('API', async () => {
    const m = await import('@tdb/slc-std/ui');
    expect(m.CanvasLayout).to.equal(CanvasLayout);
    expect(m.LogoCanvas).to.equal(LogoCanvas);
    expect(m.LogoWordmark).to.equal(LogoWordmark);
  });
});
