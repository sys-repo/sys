import { DEFAULTS, Doc } from './mod.ts';
import { Time, describe, expect, it, type t } from '../../-test.ts';
import { testSetup, type D } from './-TEST.u.ts';

describe(
  'Doc.History',

  /**
   * NOTE: The upstream [automerge-repo] library leaks timers.
   *       Waiting on this final test, with [sanitizeOps:false] prevents
   *       the entire suite failing because of these leaked timers.
   */ { sanitizeResources: false, sanitizeOps: false },

  () => {
    const { store } = testSetup();

    it('initial: <undefined>', () => {
      const history = Doc.history(undefined);
      const commits = history.commits;
      expect(history.total).to.eql(0);
      expect(commits.length).to.eql(0);
      expect(history.latest).to.eql(undefined);
    });

    it('initial: doc:<none>', async () => {
      const doc = await store.doc.getOrCreate<D>(() => null);
      const history = Doc.history(doc);
      const commits = history.commits;
      expect(history.total).to.eql(2);
      expect(commits.length).to.eql(2);
      expect(commits[0].snapshot).to.eql({});
      expect(commits[1].snapshot).to.eql({});
      expect(history.latest).to.eql(commits[1]);
    });

    it('initial: change', async () => {
      const doc = await store.doc.getOrCreate<D>((d) => (d.msg = 'hello'));
      const history = Doc.history(doc);
      expect(history.total).to.eql(2);

      const commits = history.commits;
      expect(commits[0].snapshot).to.eql({});
      expect(commits[1].snapshot).to.eql({ msg: 'hello' });
      expect(history.latest).to.eql(commits[1]);
    });

    it('change history', async () => {
      const doc = await store.doc.getOrCreate<D>(() => null);
      expect(Doc.history(doc).commits.length).to.eql(2);

      doc.change((d) => (d.msg = 'hello'));

      const history = Doc.history(doc);
      expect(history.total).to.eql(3);

      const commits = history.commits;
      expect(commits[0].snapshot).to.eql({});
      expect(commits[1].snapshot).to.eql({});
      expect(commits[2].snapshot).to.eql({ msg: 'hello' });
      expect(history.latest).to.eql(commits[2]);
    });

    it('genesis meta-data (timestamp)', async () => {
      const assert = (doc: t.Doc<D>, commitIndex: number) => {
        const history = Doc.history(doc);
        const genesis = history.genesis;
        const commits = history.commits;
        const now = Time.now.timestamp;
        const change = commits[commitIndex].change;

        expect(genesis?.initial).to.equal(commits[commitIndex]);
        expect(change.message).to.eql(DEFAULTS.genesis.message);
        expect(change.time).to.be.closeTo(now, 30);
        expect(genesis?.elapsed.msec).to.be.within(1, 20);
      };

      const binary = store.doc.toBinary<D>((d) => (d.count = 123));
      const doc1 = await store.doc.getOrCreate<D>(() => null); // NB: no initial object setup.
      const doc2 = await store.doc.getOrCreate<D>((d) => (d.count = 123));
      const doc3 = await store.doc.getOrCreate<D>(binary);

      assert(doc1, 1);
      assert(doc2, 1);
      assert(doc3, 0); // Binary.
    });

    describe('page', () => {
      const repeatChange = (doc: t.Doc<D>, length: number) => {
        Array.from({ length }).forEach(() => doc.change((d) => (d.count += 1)));
      };

      it('empty', () => {
        const history = Doc.history();
        const page = history.page(0, 5);

        expect(page.scope.index).to.eql(0);
        expect(page.scope.limit).to.eql(5);
        expect(page.scope.total).to.eql(0);
        expect(page.scope.order).to.eql(DEFAULTS.page.sort);
        expect(page.items).to.eql([]);
        expect(page.commits).to.eql([]);
      });

      it('page: [0] ← defaults', async () => {
        const doc = await store.doc.getOrCreate<D>((d) => (d.msg = 'hello'));
        repeatChange(doc, 4);

        const history = Doc.history(doc);
        const page = history.page(0, 5);

        expect(page.scope.index).to.eql(0);
        expect(page.scope.limit).to.eql(5);
        expect(page.scope.order).to.eql(DEFAULTS.page.sort);
        expect(page.items.map((e) => e.index)).to.eql([0, 1, 2, 3, 4]);
        expect(page.items.map((e) => e.commit)).to.eql(page.commits);
      });

      it('final page', async () => {
        const doc = await store.doc.getOrCreate<D>((d) => (d.msg = 'hello'));
        repeatChange(doc, 5);

        const history = Doc.history(doc);
        const page1 = history.page(0, 5);
        const page2 = history.page(1, 5);

        expect(history.total).to.eql(7);
        expect(page1.scope.total).to.eql(history.total);

        expect(page1.items.length).to.eql(5);
        expect(page2.items.length).to.eql(2);

        expect(page1.scope.is.first).to.eql(true);
        expect(page1.scope.is.last).to.eql(false);

        expect(page2.scope.is.first).to.eql(false);
        expect(page2.scope.is.last).to.eql(true);
      });

      it('out of bounds', async () => {
        const doc = await store.doc.getOrCreate<D>((d) => (d.msg = 'hello'));
        const history = Doc.history(doc);

        const test = (index: number) => {
          const res = history.page(index, 5);
          expect(res.items).to.eql([]);
          expect(res.commits).to.eql([]);
          expect(res.scope.index).to.eql(index);
          expect(res.scope.limit).to.eql(5);
          expect(res.scope.total).to.eql(2);
          expect(res.scope.is.first).to.eql(false);
          expect(res.scope.is.last).to.eql(false);
        };

        test(-1);
        test(2);
        test(999);
      });

      it('sort order: asc/desc', async () => {
        const doc = await store.doc.getOrCreate<D>((d) => (d.msg = 'hello'));
        repeatChange(doc, 4);

        const history = Doc.history(doc);
        const asc = history.page(0, 3);
        const desc = history.page(0, 3, 'desc');
        expect(asc.scope.order).to.eql('asc');
        expect(desc.scope.order).to.eql('desc');

        const ascIndexes = asc.items.map((e) => e.index);
        const descIndexes = desc.items.map((e) => e.index);

        expect(ascIndexes).to.eql([0, 1, 2]);
        expect(descIndexes).to.eql([5, 4, 3]);
      });
    });

    it('|test.dispose|', () => store.dispose());
  },
);
