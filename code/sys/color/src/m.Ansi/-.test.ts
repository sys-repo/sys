import { describe, expect, it } from '../-test.ts';
import { Color as Rgb } from '../m.Rgb/mod.ts';
import { c, Color, stripAnsi } from './mod.ts';

describe('Ansi Colors', () => {
  it('API', async () => {
    expect(Color.ansi).to.equal(c);
    expect(Color.rgb).to.equal(Rgb);

    const m = await import('@sys/color/ansi');
    expect(m.c).to.equal(c);
    expect(m.Color).to.equal(Color);
    expect(m.stripAnsi).to.equal(stripAnsi);
  });

  describe('Colors', () => {
    it('sample', () => {
      const msg = `I see a ${c.brightCyan('cyan door')} and I want it painted ${c.black('black')}.`;
      console.info(msg);
    });
  });
});
