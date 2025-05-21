import { A, Id, Is, Time, describe, expect, it, toObject, type t } from '../../-test.ts';
import { testSetup, type D } from './-TEST.u.ts';
import { Doc } from './mod.ts';

describe(
  'Doc',

  /**
   * NOTE: The upstream [automerge-repo] library leaks timers.
   *       Waiting on this final test, with [sanitizeOps:false] prevents
   *       the entire suite failing because of these leaked timers.
   */
  { sanitizeResources: false, sanitizeOps: false },

  () => {
    const { store, factory } = testSetup();

    describe('document', () => {
      it('create', async () => {
        const doc = await factory();
        expect(Id.Is.slug(doc.instance)).to.eql(true);
        expect(doc.uri).to.eql((doc as t.DocWithHandle<D>).handle.url);
        expect(doc.toObject()).to.eql(doc.current);
        expect(doc.is.ready).to.eql(true);
        expect(doc.is.deleted).to.eql(false);
      });

      it('change', async () => {
        const doc1 = await factory();
        const doc2 = await factory();
        doc2.change((d) => (d.count += 5));

        expect(doc1.instance).to.not.eql(doc2.instance);
        expect(doc1.current.count).to.eql(0);
        expect(doc2.current.count).to.eql(5);
      });

      it('change: patches callback', async () => {
        const doc = await factory();
        const patches: t.Patch[] = [];

        doc.change((d) => (d.list = []));
        doc.change((d) => d.count++, { patches: (e) => patches.push(...e) });
        doc.change(
          (d) => {
            d.count += 5;
            d.list![0] = 123;
            d.list![1] = 456;
          },
          (e) => patches.push(...e),
        );

        expect(patches[0]).to.eql({ action: 'put', path: ['count'], value: 1 });
        expect(patches[1]).to.eql({ action: 'put', path: ['count'], value: 6 });
        expect(patches[2]).to.eql({ action: 'insert', path: ['list', 0], values: [123, 456] });
      });

      it('toObject ← POJO', async () => {
        const doc = await factory();
        expect(A.isAutomerge(doc.current)).to.eql(true);
        expect(A.isAutomerge(doc.toObject())).to.eql(false);
        expect(doc.toObject()).to.eql({ count: 0 });
        expect(toObject(doc.current)).to.eql(doc.toObject());
      });
    });

    it('Doc.toHandle', async () => {
      const doc = await factory();
      const handle = Doc.toHandle(doc);
      expect(Is.handle(handle)).to.eql(true);
    });

    describe('Doc.heads', () => {
      it('undefined → []', () => {
        expect(Doc.heads(undefined)).to.eql([]);
      });

      it('initial head', async () => {
        const doc = await factory();
        const heads = Doc.heads(doc);
        const history = Doc.history(doc);
        expect(heads).to.eql([history.latest.change.hash]);
      });

      it('heads after change', async () => {
        const doc = await factory();
        const heads1 = Doc.heads(doc);

        doc.change((d) => (d.count += 1));
        const heads2 = Doc.heads(doc);
        expect(heads1).to.not.eql(heads2);

        const commits = Doc.history(doc).commits;
        expect(heads1).to.eql([commits[1].change.hash]);
        expect(heads2).to.eql([commits[2].change.hash]);
      });
    });

    describe('Doc.Tag', () => {
      it('commit: message + time (default)', async () => {
        const doc = await factory();
        expect(Doc.history(doc).total).to.eql(2);

        const res = Doc.Tag.commit(doc, 'foo');
        expect(res.message).to.eql('foo');
        // expectRoughlySame(res.time, Time.now.timestamp, 0.1);
        expect(res.time).to.be.closeTo(Time.now.timestamp, 0.1);

        const history = Doc.history(doc);
        expect(history.total).to.eql(3);
        expect(history.latest.change.time).to.eql(res.time);
        expect(history.latest.change.message).to.eql(res.message);
      });

      it('commit: pass handle', async () => {
        const doc = await factory();
        const handle = Doc.toHandle(doc);
        Doc.Tag.commit(handle, 'foo');

        const history = Doc.history(doc);
        expect(history.total).to.eql(3);
        expect(history.latest.change.message).to.eql('foo');
      });

      it('commit: exclude timestamp', async () => {
        const doc = await factory();
        Doc.Tag.commit(doc, 'foo', { time: false });
        expect(Doc.history(doc).latest.change.time).to.eql(0);
      });

      it('commit: custom timestamp', async () => {
        const doc = await factory();
        Doc.Tag.commit(doc, 'foo', { time: 1234 });
        expect(Doc.history(doc).latest.change.time).to.eql(1234);
      });
    });

    it('|test.dispose|', () => store.dispose());
  },
);
