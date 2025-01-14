import { describe, expect, it } from '../-test.ts';
import { c, Colors } from './mod.ts';

describe('Fmt', () => {
  it('API', () => {
    expect(Colors.c).to.equal(c);
  });

  describe('Colors', () => {
    it('sample', () => {
      const msg = `I see a ${c.brightCyan('cyan door')} and I want it painted ${c.black('black')}.`;
      console.info(msg);
    });
  });
});
