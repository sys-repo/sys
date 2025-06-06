import { A, describe, expect, it } from '../-test.ts';

describe('CRDT: common (runtime platform agnostic)', () => {
  describe('Automerge: raw underlying API assertions', () => {
    /**
     * Ref:
     * https://automerge.org/docs/cookbook/modeling-data/#setting-up-an-initial-document-structure
     */
    it('simple: init → change → merge', () => {
      type Card = { title: string };
      type T = { cards: Card[] };
      let doc1 = A.change<T>(A.init<T>(), (d) => (d.cards = []));
      let doc2 = A.merge<T>(A.init<T>(), doc1);

      expect(doc1).to.eql({ cards: [] });
      expect(doc2).to.eql({ cards: [] });

      doc1 = A.change(doc1, (d) => d.cards.push({ title: '👋' }));
      doc2 = A.change(doc2, (d) => d.cards.push({ title: '💦' }));

      expect(doc1).to.eql({ cards: [{ title: '👋' }] });
      expect(doc2).to.eql({ cards: [{ title: '💦' }] });

      doc1 = A.merge(doc1, doc2);
      doc2 = A.merge(doc2, doc1);

      expect(doc2.cards).to.have.deep.members([{ title: '💦' }, { title: '👋' }]);
      expect(doc1.cards).to.have.deep.members([{ title: '💦' }, { title: '👋' }]);
    });
  });
});
