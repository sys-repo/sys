import { describe, it } from '../-test.ts';
import { c } from './mod.ts';

describe('Fmt', () => {
  describe('Colors', () => {
    it('sample', () => {
      console.log(`I see a ${c.red('red door')} and I want it painted ${c.black('black')}`);
    });
  });
});
