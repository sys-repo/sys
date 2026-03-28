import { describe, expect, it } from '../../../-test.ts';
import { Color, COLORS } from '../mod.ts';
import { Theme } from '../../m.Theme/mod.ts';
import {
  alpha,
  darken,
  lighten,
  ruby,
  toGrayAlpha,
  toHex,
} from '../../u.ts';

describe('Color', () => {
  it('API wiring', () => {
    expect(Color.Theme).to.equal(Theme);
    expect(Color.theme).to.equal(Theme.create);

    expect(Color.BLACK).to.equal(COLORS.BLACK);
    expect(Color.WHITE).to.equal(COLORS.WHITE);
    expect(Color.RED).to.equal(COLORS.RED);

    expect(Color.alpha).to.equal(alpha);
    expect(Color.ruby).to.equal(ruby);
    expect(Color.lighten).to.equal(lighten);
    expect(Color.darken).to.equal(darken);
    expect(Color.toHex).to.equal(toHex);
    expect(Color.toGrayAlpha).to.equal(toGrayAlpha);
  });
});
