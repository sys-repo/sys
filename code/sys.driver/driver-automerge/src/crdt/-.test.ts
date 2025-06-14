import { Repo } from '@automerge/automerge-repo';

import { describe, expect, it } from '../-test.ts';
import { CrdtIs } from './mod.ts';
import { toRepo } from './u.repo.ts';

describe('Crdt', { sanitizeResources: false, sanitizeOps: false }, () => {
  type T = { count: number };
  const repo = toRepo(new Repo());
  const Is = CrdtIs;

  describe('Is', () => {
    it('Is.ref', () => {
      const doc = repo.create<T>({ count: 0 });
      expect(Is.ref(doc)).to.be.true;

      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value: any) => expect(CrdtIs.ref(value)).to.be.false);
    });

    it('Is.id', () => {
      const doc = repo.create<T>({ count: 0 });
      expect(Is.id(doc.id)).to.be.true;
      expect(Is.id(String(doc.id))).to.be.true;

      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value: any) => expect(CrdtIs.ref(value)).to.be.false);
    });
  });
});
