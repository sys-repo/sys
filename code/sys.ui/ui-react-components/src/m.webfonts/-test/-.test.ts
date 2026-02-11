import { describe, expect, it } from '../../-test.ts';
import { Fonts, useFontBundle } from '../mod.ts';
import { ETBook } from '../u.family.et-book.ts';
import { SourceSans3 } from '../u.family.source-sans-3.ts';

describe(`WebFonts`, () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-components/fonts');
    expect(m.useFontBundle).to.equal(useFontBundle);
    expect(m.Fonts).to.equal(Fonts);

    // Font bundles:
    expect(Fonts.ETBook).to.equal(ETBook);
    expect(Fonts.SourceSans3).to.equal(SourceSans3);
  });
});
