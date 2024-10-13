import { Doc } from './mod.ts';
import { describe, expect, it } from '../../-test.ts';
import { Mutate } from './u.ts';

type O = Record<string, unknown>;

describe('Mutate', () => {
  describe('emptyChange', () => {
    it('leaves no trace on the object', () => {
      const obj = {} as any;
      Mutate.emptyChange(obj);
      expect(obj.__tmp).to.eql(undefined);
    });
  });

  describe('ensure', () => {
    type T = { child?: { foo: number } };
    const notNull = <T extends O>(_value: T) => true;

    it('exposed from Doc', () => {
      expect(Doc.ensure).to.equal(Mutate.ensure);
    });

    it('target already exists', () => {
      const obj: T = { child: { foo: 123 } };
      const res = Mutate.ensure(obj, 'child', { foo: 0 });
      expect(res).to.equal(obj.child);
      notNull(res); // NB: type check (required).
    });

    it('adds a new target: default value', () => {
      const obj: T = {};
      const res = Mutate.ensure(obj, 'child', { foo: 0 });
      expect(res).to.eql({ foo: 0 });
      expect(obj.child).to.equal(res);
    });
  });
});
