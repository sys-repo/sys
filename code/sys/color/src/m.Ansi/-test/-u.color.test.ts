import { describe, expect, it } from '../../-test.ts';
import { Color as rgb } from '../../m.Rgb/mod.ts';
import { c } from '../common.ts';
import { Color } from '../u.color.ts';
import { escape } from '../u.escape.ts';
import { foreground } from '../u.foreground.ts';

describe('Ansi.Color', () => {
  it('assembles the ANSI color library from focused primitives', () => {
    expect(Color.ansi).to.equal(c);
    expect(Color.foreground).to.equal(foreground);
    expect(Color.escape).to.equal(escape);
    expect(Color.rgb).to.equal(rgb);
  });
});
