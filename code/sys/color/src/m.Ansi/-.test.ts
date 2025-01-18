import { describe, expect, it } from '../-test.ts';
import { c, Colors, stripAnsi } from './mod.ts';

describe('Ansi Colors', () => {
  it('API', async () => {
    expect(Colors.c).to.equal(c);

    const m = await import('@sys/color/ansi');
    expect(m.c).to.equal(c);
    expect(m.Colors).to.equal(Colors);
    expect(m.stripAnsi).to.equal(stripAnsi);
  });

  describe('Colors', () => {
    it('sample', () => {
      const msg = `I see a ${c.brightCyan('cyan door')} and I want it painted ${c.black('black')}.`;
      console.info(msg);
    });
  });
});
