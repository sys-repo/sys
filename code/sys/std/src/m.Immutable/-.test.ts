import { describe, expect, it, type t } from '../-test.ts';
import { Immutable } from './mod.ts';

describe('Immutable', () => {
  type P = t.PatchOperation;
  type D = { count: number; list?: number[] };

  describe('Immutable.Is', () => {
    const Is = Immutable.Is;
    const NON = [123, 'abc', [], {}, undefined, null, true, Symbol('foo'), BigInt(0)];

    it('Is.immutable', () => {
      NON.forEach((v) => expect(Is.immutable(v)).to.eql(false));
      const obj = Immutable.cloner<D>({ count: 0 });
      expect(Is.immutable(obj)).to.eql(true);
    });

    it('Is.immutableRef', () => {
      NON.forEach((v) => expect(Is.immutable(v)).to.eql(false));
      const obj = Immutable.cloner<D>({ count: 0 });
      const objRef = Immutable.clonerRef<D>({ count: 0 });
      expect(Is.immutableRef(obj)).to.eql(false);
      expect(Is.immutableRef(objRef)).to.eql(true);
    });
  });
});
