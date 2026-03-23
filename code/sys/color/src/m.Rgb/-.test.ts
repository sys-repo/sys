import { describe, expect, it, pkg } from '../-test.ts';
import { Color, COLORS, Theme } from './mod.ts';

describe('Color', () => {
  it('API', async () => {
    const root = await import('@sys/color');
    const m = await import('@sys/color/rgb');
    expect(root.Color).to.equal(Color);
    expect(root.pkg).to.equal(pkg);

    expect(m.Color).to.equal(Color);
    expect(m.COLORS).to.equal(COLORS);
    expect(m.Theme).to.equal(Theme);

    expect(Color.Theme).to.equal(Theme);
  });
});
