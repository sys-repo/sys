import { describe, expect, it } from '../../-test.ts';
import { Fonts, useFontBundle } from '../mod.ts';
import { ETBook } from '../u.family.et-book.ts';

describe(`WebFonts`, () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-components/fonts');
    expect(m.Fonts).to.equal(Fonts);
    expect(Fonts.ETBook).to.equal(ETBook);
    expect(m.ETBook).to.equal(ETBook);
    expect(m.useFontBundle).to.equal(useFontBundle);
  });
});
