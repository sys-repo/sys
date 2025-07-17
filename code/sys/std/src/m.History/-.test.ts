import { type t, describe, expect, it } from '../-test.ts';
import { History } from './mod.ts';

describe('History', () => {
  describe('History.stack', () => {
    it('creates with no items', () => {
      const h = History.stack();
      expect(h.items).to.eql([]);
    });

    it('creates with pre-existing items', () => {
      const items = ['one', 'two', 'three'];
      const h = History.stack({ items });
      expect(h.items).to.eql(items);
    });

    it('push: de-dupes and keeps newest first', () => {
      const h = History.stack();
      h.push('alpha');
      h.push('beta');
      h.push('alpha'); // duplicate – moves to head
      expect(h.items).to.eql(['alpha', 'beta']);
    });

    it('remove', () => {
      const h = History.stack();
      ['one', 'two', 'three'].forEach(h.push);

      const a = h.remove('two');
      const b = h.remove('404');

      expect(h.items).to.eql(['three', 'one']);
      expect(a).to.eql(true);
      expect(b).to.eql(false);
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

    it('reset navigation cursor (HEAD)', () => {
      const h = History.stack();
      const initial = ['one', 'two', 'three'];
      initial.forEach(h.push);
      expect(h.current).to.eql(undefined);
      expect(h.index).to.eql(-1);

      h.back();
      expect(h.index).to.eql(0);
      expect(h.current).to.eql('three');

      h.back();
      expect(h.index).to.eql(1);
      expect(h.current).to.eql('two');

      const fired: t.HistoryStackChange[] = [];
      h.onChange((e) => fired.push(e));

      h.reset();
      h.reset(); // NB: multiple calls will not trigger repeate change events.
      h.reset();
      expect(h.current).to.eql(undefined);
      expect(h.index).to.eql(-1);

      expect(fired.length).to.eql(1);
      expect(fired[0].index).to.eql(-1);
      expect(fired[0].before).to.eql(initial.toReversed());
      expect(fired[0].after).to.eql(initial.toReversed());
    });

    it('does not add head more than once', () => {
      const h = History.stack();
      h.push('a');
      h.push('a');
      expect(h.items).to.eql(['a']);
    });

    it('onChange: listener', () => {
      const h = History.stack();

      const fired: t.HistoryStackChange[] = [];
      const handler: t.HistoryStackChangeHandler = (e) => fired.push(e);
      h.onChange(handler);
      h.onChange(handler);
      h.onChange(handler); // ↑ NB: repeat registrations do not double-up event firing.

      h.push('a');
      expect(fired.length).to.eql(1);
      expect(fired[0]).to.eql({ index: -1, before: [], after: ['a'] });

      h.push('b');
      expect(fired[1]).to.eql({ index: -1, before: ['a'], after: ['b', 'a'] });

      h.back();
      expect(fired[2]).to.eql({ index: 0, before: ['b', 'a'], after: ['b', 'a'] });

      h.back();
      expect(fired[3]).to.eql({ index: 1, before: ['b', 'a'], after: ['b', 'a'] });

      h.forward();
      expect(fired[2]).to.eql({ index: 0, before: ['b', 'a'], after: ['b', 'a'] });
    });
  });
});
