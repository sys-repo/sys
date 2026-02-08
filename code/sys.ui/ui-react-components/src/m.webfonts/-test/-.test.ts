import { describe, expect, it } from '../../-test.ts';
import { WebFonts } from '../mod.ts';
import { ETBook } from '../u.family.et-book.ts';

describe(`WebFonts`, () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-components/fonts');
    expect(m.WebFonts).to.equal(WebFonts);
    expect(WebFonts.ETBook).to.equal(ETBook);
    expect(m.ETBook).to.equal(ETBook);
  });
});
