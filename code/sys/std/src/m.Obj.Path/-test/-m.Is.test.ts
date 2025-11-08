import { describe, expect, it } from '../../-test.ts';
import { Path } from '../mod.ts';

describe('Obj.Path.Is', () => {
  describe('Path.Is.path', () => {
    it('valid: empty', () => {
      expect(Path.Is.path([])).to.equal(true);
    });

    it('valid: strings', () => {
      expect(Path.Is.path(['a'])).to.equal(true);
      expect(Path.Is.path(['a', 'b', 'c'])).to.equal(true);
      expect(Path.Is.path(['0'])).to.equal(true); // string token is allowed
    });

    it('valid: integers', () => {
      expect(Path.Is.path([0])).to.equal(true);
      expect(Path.Is.path([0, 2, 10])).to.equal(true);
    });

    it('valid: mixed string/integer', () => {
      expect(Path.Is.path(['a', 0, 'b', 2])).to.equal(true);
    });

    it('invalid: non-array', () => {
      expect(Path.Is.path(undefined)).to.equal(false);
      expect(Path.Is.path(null)).to.equal(false);
      expect(Path.Is.path('a' as any)).to.equal(false);
      expect(Path.Is.path(1 as any)).to.equal(false);
      expect(Path.Is.path({} as any)).to.equal(false);
    });

    it('invalid: bad element types', () => {
      expect(Path.Is.path([true] as any)).to.equal(false);
      expect(Path.Is.path([Symbol('s')] as any)).to.equal(false);
      expect(Path.Is.path([[0]] as any)).to.equal(false);
      expect(Path.Is.path([{}] as any)).to.equal(false);
      expect(Path.Is.path([() => 1] as any)).to.equal(false);
    });

    it('invalid: non-integer/unsafe numbers', () => {
      expect(Path.Is.path([0.5] as any)).to.equal(false);
      expect(Path.Is.path([NaN] as any)).to.equal(false);
      expect(Path.Is.path([Infinity] as any)).to.equal(false);
      expect(Path.Is.path([-Infinity] as any)).to.equal(false);
      expect(Path.Is.path([Number.MAX_SAFE_INTEGER + 1] as any)).to.equal(false);
    });

    it('readonly arrays still pass (runtime check is structural)', () => {
      const p = ['a', 1] as const;
      expect(Path.Is.path(p)).to.equal(true);
    });
  });

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
