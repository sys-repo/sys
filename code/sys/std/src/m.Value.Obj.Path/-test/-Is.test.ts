import { describe, expect, it } from '../../-test.ts';
import { Path } from '../mod.ts';

describe('Obj.Path.Is', () => {
  describe('equal', () => {
    it('[] == []', () => {
      expect(Path.Is.eql([], [])).to.be.true;
    });

    it("['a'] == ['a']", () => {
      expect(Path.Is.eql(['a'], ['a'])).to.be.true;
    });

    it("['a'] != ['b']", () => {
      expect(Path.Is.eql(['a'], ['b'])).to.be.false;
    });

    it("['a'] != ['a','b']", () => {
      expect(Path.Is.eql(['a'], ['a', 'b'])).to.be.false;
    });
  });

  describe('prefixOf (includes equal)', () => {
    it('[] is prefix of [] and of anything', () => {
      expect(Path.Is.prefixOf([], [])).to.be.true;
      expect(Path.Is.prefixOf([], ['a'])).to.be.true;
      expect(Path.Is.prefixOf([], ['a', 'b'])).to.be.true;
    });

    it("['a'] prefix of ['a'] (equal)", () => {
      expect(Path.Is.prefixOf(['a'], ['a'])).to.be.true;
    });

    it("['a'] prefix of ['a','b']", () => {
      expect(Path.Is.prefixOf(['a'], ['a', 'b'])).to.be.true;
    });

    it("['a','b'] NOT prefix of ['a']", () => {
      expect(Path.Is.prefixOf(['a', 'b'], ['a'])).to.be.false;
    });

    it("diverge at same depth → not prefix: ['a','b'] vs ['a','c']", () => {
      expect(Path.Is.prefixOf(['a', 'b'], ['a', 'c'])).to.be.false;
      expect(Path.Is.prefixOf(['a', 'c'], ['a', 'b'])).to.be.false;
    });
  });

  describe('ancestorOf / descendantOf', () => {
    it('equal paths are not ancestor/descendant', () => {
      expect(Path.Is.ancestorOf(['x'], ['x'])).to.be.false;
      expect(Path.Is.descendantOf(['x'], ['x'])).to.be.false;
    });

    it("['a'] ancestor of ['a','b']", () => {
      expect(Path.Is.ancestorOf(['a'], ['a', 'b'])).to.be.true;
      expect(Path.Is.descendantOf(['a', 'b'], ['a'])).to.be.true;
    });

    it("deep ancestor: ['a'] ancestor of ['a','b','c']", () => {
      expect(Path.Is.ancestorOf(['a'], ['a', 'b', 'c'])).to.be.true;
      expect(Path.Is.descendantOf(['a', 'b', 'c'], ['a'])).to.be.true;
    });

    it('disjoint → neither ancestor nor descendant', () => {
      expect(Path.Is.ancestorOf(['a'], ['b'])).to.be.false;
      expect(Path.Is.descendantOf(['a'], ['b'])).to.be.false;
    });

    it('numeric segments also work', () => {
      expect(Path.Is.ancestorOf(['list'], ['list', 0])).to.be.true;
      expect(Path.Is.descendantOf(['list', 0], ['list'])).to.be.true;
    });

    it('symmetry: descendantOf(a,b) === ancestorOf(b,a)', () => {
      const pairs: Array<[Array<string | number>, Array<string | number>]> = [
        [[], []],
        [['a'], ['a']],
        [['a'], ['a', 'b']],
        [['a', 'b'], ['a']],
        [['a'], ['b']],
      ];
      for (const [a, b] of pairs) {
        expect(Path.Is.descendantOf(a, b)).to.equal(Path.Is.ancestorOf(b, a));
      }
    });
  });
});
