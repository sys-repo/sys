import { WebStore } from '.';
import { A, Doc, Is, Test, TestDb, expect, rx, type t } from '../../test.ui';
import { DEFAULTS } from './common';

type D = { count?: t.A.Counter };

export default Test.describe('Store.Web (Repo)', (e) => {
  const name = TestDb.Unit.name;
  const store = WebStore.init({ storage: false });

  const initial: t.ImmutableMutator<D> = (d) => (d.count = new A.Counter(0));
  const assertCount = (doc: t.Doc<D>, expected: number) => {
    expect(doc.current.count?.value).to.eql(expected);
  };

  e.it('WebStore.Doc', (e) => {
    expect(WebStore.Doc).to.equal(Doc);
  });

  e.describe('initialize', (e) => {
    e.it('Is.webStore', (e) => {
      expect(Is.webStore(store)).to.eql(true);
    });

    e.it('Is.repo', (e) => {
      expect(Is.repo(store.repo)).to.eql(true);
    });

    e.it('defaults: storage | network', (e) => {
      const store = WebStore.init();
      const { networkSubsystem, storageSubsystem } = store.repo;
      expect(Is.networkSubsystem(networkSubsystem)).to.eql(true, 'network');
      expect(Is.storageSubsystem(storageSubsystem)).to.eql(true, 'storage');
      expect(store.info.storage?.name).to.eql(DEFAULTS.storage.name);
      expect(store.info.storage?.kind === 'IndexedDb').to.eql(true);
      expect(store.info.network?.kinds).to.eql(['BroadcastChannel']);
      store.dispose();
    });

    e.it('no storage', (e) => {
      const store = WebStore.init({ storage: false });
      expect(Is.storageSubsystem(store.repo.storageSubsystem)).to.eql(false);
      expect(store.repo.storageSubsystem).to.eql(undefined);
      expect(store.info.storage).to.eql(undefined);
      store.dispose();
    });

    e.it('storage with custom name', (e) => {
      const name = TestDb.Unit.name;
      const store1 = WebStore.init({ storage: name });
      const store2 = WebStore.init({ storage: { name } });
      expect(store1.info.storage?.name).to.eql(name);
      expect(store2.info.storage?.name).to.eql(name);
      store1.dispose();
      store2.dispose();
    });

    e.it('no storage, no network', (e) => {
      const store = WebStore.init({ storage: false, network: false });
      expect(store.info.storage).to.eql(undefined);
      expect(store.info.network).to.eql(undefined);
      store.dispose();
    });
  });

  e.describe('lifecycle', (e) => {
    e.it('dispose', (e) => {
      const store = WebStore.init({ storage: { name } });
      expect(store.disposed).to.eql(false);
      store.dispose();
      expect(store.disposed).to.eql(true);
    });

    e.it('dispose$', (e) => {
      const { dispose, dispose$ } = rx.disposable();
      const store = WebStore.init({ dispose$, storage: { name } });
      expect(store.disposed).to.eql(false);
      dispose();
      expect(store.disposed).to.eql(true);
    });
  });

  e.describe('store.doc.getOrCreate', (e) => {
    e.it('initial creation', async (e) => {
      const doc1 = await store.doc.getOrCreate<D>(initial);
      const doc2 = await store.doc.getOrCreate<D>(initial);

      type H = t.DocWithHandle<D>;
      expect((doc1 as H).handle.state).to.eql('ready');
      expect(doc1.uri).to.eql((doc1 as H).handle.url);
      expect(doc1.is.ready).to.eql(true);
      expect(doc1.is.deleted).to.eql(false);
      assertCount(doc1, 0);
      assertCount(doc2, 0);

      expect(doc1.uri).to.not.eql(doc2.uri); // NB: A new document retrieved.
      expect(doc1.current).to.not.equal(doc2.current);
      expect(doc1.current).to.eql(doc2.current);
    });

    e.it('retrieve existing (from URI)', async (e) => {
      const doc1 = await store.doc.getOrCreate<D>(initial);
      const doc2 = await store.doc.getOrCreate<D>(initial, doc1.uri);
      expect(doc1.uri).to.eql(doc2.uri);
      expect(doc1.current).to.equal(doc2.current);
    });
  });

  e.describe('store.doc.factory (generator)', (e) => {
    e.it('unique docs', async (e) => {
      const generator = store.doc.factory<D>(initial);
      const doc1 = await generator();
      const doc2 = await generator();

      expect(doc1.uri).to.not.eql(doc2.uri);
      expect(doc1.current).to.eql(doc2.current);
      expect(doc1.current).to.not.equal(doc2.current);
    });

    e.it('retrieve same doc via URI', async (e) => {
      const generator = store.doc.factory<D>(initial);
      const doc1 = await generator();
      const doc2 = await generator(doc1.uri);
      expect(doc1.uri).to.eql(doc2.uri);
      expect(doc1.current).to.equal(doc2.current);
    });
  });

  e.describe('store.doc (change)', (e) => {
    const generator = store.doc.factory<D>(initial);

    e.it('change', async (e) => {
      const doc = await generator();
      assertCount(doc, 0);
      doc.change((d) => d.count?.increment(5));
      assertCount(doc, 5);
    });
  });
});
