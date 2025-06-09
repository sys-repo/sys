import { describe, expect, it } from '../-test.ts';
import { CrdtIs } from './mod.ts';
import { toRepo } from './u.toRepo.ts';

describe('Crdt', { sanitizeResources: false, sanitizeOps: false }, () => {
  type T = { count: number };

  describe('Is', () => {
    it('Is.ref', () => {
      const repo = toRepo();
      const doc = repo.create<T>({ count: 0 });
      expect(CrdtIs.ref(doc)).to.eql(true);

      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value: any) => expect(CrdtIs.ref(value)).to.eql(false));
    });
  });
});
