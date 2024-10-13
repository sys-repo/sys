import { describe, expect, it, rx, Testing, type t } from '../../-test.ts';
import { Store } from '../../mod.ts';
import { Doc } from './mod.ts';

const Uri = Store.Doc.Uri;

type O = Record<string, unknown>;
type D = { count: number; msg?: string };

describe(
  'Doc: binary ← "hard-coded byte array hack"',

  /**
   * NOTE: The upstream [automerge-repo] library leaks timers.
   *       Waiting on this final test, with [sanitizeOps:false] prevents
   *       the entire suite failing because of these leaked timers.
   */
  { sanitizeExit: false, sanitizeResources: false, sanitizeOps: false },

  () => {
    const sampleBinary = () => Store.Doc.toBinary<D>((d) => (d.count = 0));

    describe('Store.Doc: toBinary', () => {
      it('from function', () => {
        const store = Store.init();
        const binary = Store.Doc.toBinary<D>((d) => (d.count = 123));
        const doc = store.doc.fromBinary<D>(binary);
        expect(doc.current.count).to.eql(123);
        store.dispose();
      });

      it('from doc', async () => {
        const store = Store.init();
        const doc1 = await store.doc.getOrCreate<D>((d) => (d.count = 888));
        const doc2 = store.doc.fromBinary<D>(Store.Doc.toBinary<D>(doc1));
        expect(doc2.current.count).to.eql(888);
        store.dispose();
      });
    });

    describe('Store.Doc: fromBinary', () => {
      it('from given URI', async () => {
        const store = Store.init();
        const binary = sampleBinary();
        const uri = Uri.Generate.uri();

        const exists = () => store.doc.exists(uri, { timeout: 30 });
        expect(await exists()).to.eql(false);

        const doc1 = store.doc.fromBinary(binary, { uri });
        const doc2 = store.doc.fromBinary(binary, uri);
        store.dispose();

        expect(doc1.is.ready).to.eql(true);
        expect(doc1.current).to.eql({ count: 0 });
        expect(await exists()).to.eql(true);

        expect(doc1.uri).to.eql(doc2.uri);
        expect(doc1.current).to.eql(doc2.current);
      });

      it('generates URI', async () => {
        const store = Store.init();
        const binary = sampleBinary();
        const doc = store.doc.fromBinary(binary);
        store.dispose();

        expect(await store.doc.exists(doc.uri, { timeout: 30 })).to.eql(true);
        expect(doc.current).to.eql({ count: 0 });
      });

      it('dispose$', async () => {
        const store = Store.init();
        const binary = sampleBinary();
        const { dispose, dispose$ } = rx.disposable();

        const doc1 = store.doc.fromBinary(binary, { dispose$ });
        const doc2 = store.doc.fromBinary(binary);
        const doc3 = await store.doc.getOrCreate<D>((d) => (d.count = 123));
        const events1 = doc1.events();
        const events2 = doc2.events();
        const events3 = doc3.events();

        expect(events1.disposed).to.eql(false);
        expect(events2.disposed).to.eql(false);
        expect(events3.disposed).to.eql(false);

        expect(events1.disposed).to.eql(false);
        expect(events2.disposed).to.eql(false);
        expect(events3.disposed).to.eql(false);

        dispose();
        expect(events1.disposed).to.eql(true);
        expect(events2.disposed).to.eql(false);
        expect(events3.disposed).to.eql(false);

        store.dispose();
        expect(events1.disposed).to.eql(true);
        expect(events2.disposed).to.eql(true);
        expect(events3.disposed).to.eql(true);
      });

      it('throw: invalid URI', () => {
        const store = Store.init();
        const binary = sampleBinary();
        const fn = () => store.doc.fromBinary(binary, { uri: 'foo' });
        expect(fn).to.throw(/Invalid document URI/);
        store.dispose();
      });

      it('throw: invalid binary', () => {
        const store = Store.init();
        const fn = () => store.doc.fromBinary(new Uint8Array([1, 2, 3]));
        expect(fn).to.throw(/Invalid document binary/);
        store.dispose();
      });
    });

    describe('mering from same genesis', () => {
      it('merge: A → B', () => {
        const store = Store.init();
        const binary = sampleBinary();

        // Seperate lineages but from same genesis binary.
        const docA = store.doc.fromBinary<D>(binary);
        const docB = store.doc.fromBinary<D>(binary);
        expect(docA.uri).to.not.eql(docB.uri);

        docA.change((d) => (d.count = 123));
        expect(docA.current.count).to.eql(123);
        expect(docB.current.count).to.eql(0);

        Doc.merge(docA, docB);
        expect(docA.current.count).to.eql(123);
        expect(docB.current.count).to.eql(123);

        store.dispose();
      });

      it('merge: A → B (not the same gensis, does not merge)', () => {
        Testing.retry(3, { delay: 10, message: 'merge: A → B' }, () => {
          const store = Store.init();
          const binaryA = Store.Doc.toBinary<D>((d) => (d.count = 0));
          const binaryB = Store.Doc.toBinary<D>((d) => {
            d.count = 0;
            d.msg = 'hello';
          });

          // Seperate lineages but from same genesis binary.
          const docA = store.doc.fromBinary<D>(binaryA);
          const docB = store.doc.fromBinary<D>(binaryB);
          expect(docA.uri).to.not.eql(docB.uri);

          docA.change((d) => (d.count = 123));
          expect(docA.current).to.eql({ count: 123 }); // NB: changed value (A)
          expect(docB.current).to.eql({ count: 0, msg: 'hello' });

          Doc.merge(docA, docB);
          expect(docA.current).to.eql({ count: 123 });
          expect(docB.current).to.eql({ count: 0, msg: 'hello' }); // NB: unchanged value (B) because different genesis binary.

          store.dispose();
        });
      });

      it('clone and merge → to target document with new uri', () => {
        const store = Store.init();
        const binary = sampleBinary();

        // Seperate lineages but from same genesis binary.
        const doc1 = store.doc.fromBinary<D>(binary);
        const doc2 = store.doc.fromBinary<D>(binary);
        expect(doc1.uri).to.not.eql(doc2.uri);

        doc2.change((d) => (d.count = 888));

        function cloneAndMerge<T extends O>(source: t.Doc<T>, target: t.Doc<T>) {
          const doc = store.doc.fromBinary(Doc.toBinary(source), target.uri);
          Doc.merge(target, doc);
          return doc;
        }

        const doc3 = cloneAndMerge(doc1, doc2);
        expect(doc3.uri).to.eql(doc2.uri);
        expect(doc3.current.count).to.eql(888);
      });
    });
  },
);
