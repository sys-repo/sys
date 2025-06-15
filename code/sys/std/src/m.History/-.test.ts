import { describe, expect, it } from '../-test.ts';
import { History } from './mod.ts';

describe('History', () => {
  describe('History.stack', () => {
    it('de-dupes and keeps newest first', () => {
      const h = History.stack();
      h.push('alpha');
      h.push('beta');
      h.push('alpha'); // duplicate – moves to head
      expect(h.items).to.eql(['alpha', 'beta']);
    });

    it('creates with pre-existing items', () => {
      const items = ['one', 'two', 'three'];
      const h = History.stack({ items });
      expect(h.items).to.eql(items);
    });

    it('navigates back/forward', () => {
      const h = History.stack();
      ['one', 'two', 'three'].forEach(h.push);

      expect(h.back()).to.eql('three'); //      ← up 1.
      expect(h.back()).to.eql('two'); //        ← up 2.
      expect(h.back()).to.eql('one'); //        ← up 3 (oldest).
      expect(h.back()).to.eql('one'); //        ← sticks on oldest.

      expect(h.forward()).to.eql('two'); //     ← down 1.
      expect(h.forward()).to.eql('three'); //   ← down 2 (newest).
      expect(h.forward()).to.be.undefined; //   ← live prompt.
      expect(h.forward()).to.be.undefined; //   ← stays live.
    });

    it('navigates back, skips provided "current" (recusion)', () => {
      const h = History.stack();
      ['one', 'two', 'three'].forEach(h.push);

      expect(h.back('three')).to.eql('two');
      expect(h.back()).to.eql('one');
      expect(h.back()).to.eql('one'); // NB: sticks on oldest.
    });

    it('respects the max-cap', () => {
      const h = History.stack({ max: 2 });
      h.push('x');
      h.push('y');
      h.push('z'); // pushes out 'x'.
      expect(h.items).to.eql(['z', 'y']);
    });

    it('reset navigation cursor after push', () => {
      const h = History.stack();
      h.push('foo');
      h.back(); //                            ← now at 'foo'.
      h.push('bar'); //                       ← new push resets cursor.
      expect(h.forward()).to.be.undefined; // ← already live.
      expect(h.back()).to.eql('bar'); //      ← newest again.
    });
  });
});
