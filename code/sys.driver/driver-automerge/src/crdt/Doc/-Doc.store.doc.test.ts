import { Is, describe, expect, expectError, it, type t } from '../../-test.ts';
import { Store } from '../Store/mod.ts';
import { testSetup, type D } from './-TEST.u.ts';

describe(
  'Doc',

  /**
   * NOTE: The upstream [automerge-repo] library leaks timers.
   *       Waiting on this final test, with [sanitizeOps:false] prevents
   *       the entire suite failing because of these leaked timers.
   */
  { sanitizeExit: false, sanitizeResources: false, sanitizeOps: false },

  () => {
    const FAIL_URI = 'automerge:2eE9k3p2iGcsHkpKy6t1jivjDeXJ';
    const { store, initial, factory } = testSetup();

    describe('store.doc.exists', () => {
      it('exists: true', async () => {
        const store = Store.init();
        const doc = await store.doc.getOrCreate<D>(initial);
        const exists = await store.doc.exists(doc.uri);
        expect(exists).to.eql(true);
        store.dispose();
      });

      it('exists: false (404)', async () => {
        const store = Store.init();
        const test = async (uri: any, expected: boolean) => {
          const exists = await store.doc.exists(uri, { timeout: 10 });
          expect(exists).to.eql(expected, uri);
        };

        for (const uri of ['404', true, null, undefined, [], {}]) {
          await test(uri, false);
        }

        expect(Is.automergeUrl(FAIL_URI)).to.eql(true); // NB: ensure we test for a non-existent document, not a malformed URI.
        await test(FAIL_URI, false);

        store.dispose();
      });

      it('exists: false (deleted)', async () => {
        const store = Store.init();
        const doc = await store.doc.getOrCreate<D>(initial);
        expect(doc.is.deleted).to.eql(false);

        const test = async (expected: boolean) => {
          const exists = await store.doc.exists(doc.uri, { timeout: 50 });
          expect(exists).to.eql(expected, doc.uri);
        };

        await test(true);
        await store.doc.delete(doc.uri);
        expect(doc.is.deleted).to.eql(true);
        await test(false);

        store.dispose();
      });
    });

    describe('store.doc.get', () => {
      it('get: success (document)', async () => {
        const store = Store.init();

        const doc1 = await store.doc.getOrCreate<D>(initial);
        const doc2 = await store.doc.get<D>(doc1.uri);
        const doc3 = await store.doc.get<D>(undefined);

        expect(doc1.is.ready).to.eql(true);
        expect(doc1.uri).to.eql(doc2?.uri);
        expect(doc2?.current).to.eql(doc1.current);
        expect(doc3).to.eql(undefined);

        store.dispose();
      });

      it('get: undefined (not found)', async () => {
        const store = Store.init();
        const doc = await store.doc.get<D>(FAIL_URI, { timeout: 30 });
        expect(doc).to.eql(undefined);
        store.dispose();
      });
    });

    describe('store.doc.getOrCreate', () => {
      it('"ready" by default', async () => {
        const doc = await store.doc.getOrCreate(initial);
        expect((doc as t.DocWithHandle<D>).handle.state).to.eql('ready');
        expect(doc.is.ready).to.eql(true);
        expect(doc.is.deleted).to.eql(false);
        store.dispose();
      });

      it('initial as binary (Uint8Array)', async () => {
        const binary = store.doc.toBinary<D>((d) => (d.count = 123));
        const doc1 = await store.doc.getOrCreate(initial);
        const doc2 = await store.doc.getOrCreate(binary);
        expect(doc1.current.count).to.eql(0);
        expect(doc2.current.count).to.eql(123);
      });

      it('throw: bad URI times out', async () => {
        expect(Is.automergeUrl(FAIL_URI)).to.eql(true); // NB: make sure we are testing a valid, but non-existent URI.

        const timeout = 30;
        const err = 'Failed to retrieve document for the given URI';
        const fn = () => store.doc.getOrCreate(initial, FAIL_URI, { timeout });
        await expectError(fn, err);

        store.dispose();
      });
    });

    describe('store.doc.factory (generator)', () => {
      it('different documents (generate)', async () => {
        const doc1 = await factory();
        const doc2 = await factory();
        expect(doc1.uri).to.not.eql(doc2.uri);
      });

      it('same document (find via DocUri)', async () => {
        const doc1 = await factory();
        const doc2 = await factory(doc1.uri);
        expect(doc1.uri).to.eql(doc2.uri);
      });

      it('same document (find via DocUri as string)', async () => {
        const doc1 = await factory();
        const doc2 = await factory(`${doc1.uri}`);
        expect(doc1.uri).to.eql(doc2.uri);
      });
    });

    describe('store.doc.delete', () => {
      it('no URI ← false', async () => {
        const res = await store.doc.delete(undefined, { timeout: 10 });
        expect(res).to.eql(false);
      });

      it('delete ← true (success)', async () => {
        const doc = await factory();
        expect(doc.is.deleted).to.eql(false);
        expect(doc.is.ready).to.eql(true);

        const res = await store.doc.delete(doc.uri);
        expect(res).to.eql(true);
        expect(doc.is.deleted).to.eql(true);
        expect(doc.is.ready).to.eql(false);
      });

      it('delete ← false (does not exist)', async () => {
        const doc = await factory();
        expect(doc.is.deleted).to.eql(false);

        const uri = 'automerge:3Y6RQm4fUWc6Pt6SS3iShhbGcZBJ'; // NB: does not exist.
        const res = await store.doc.delete(uri, { timeout: 10 });
        expect(res).to.eql(false);
        expect(doc.is.deleted).to.eql(false); // Still not deleted (ie. the URI above had nothing to do with the document).
      });

      it('no effect when .change(..) called after deletion', async () => {
        const doc = await factory();
        expect(doc.is.deleted).to.eql(false);

        doc.change((d) => (d.count = 123));
        expect(doc.current.count).to.eql(123);

        const deleted = await store.doc.delete(doc.uri);
        expect(deleted).to.eql(true);

        doc.change((d) => (d.count = 456));
        expect(doc.current).to.eql({});
      });
    });

    it('|test.dispose|', () => store.dispose());
  },
);
