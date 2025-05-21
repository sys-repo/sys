import { BroadcastChannelNetworkAdapter } from '@automerge/automerge-repo-network-broadcastchannel';
import { Doc, Is, Store, WebStore } from '../mod.ts';
import { describe, expect, it, type t } from '../-test.ts';

describe('Is (flags)', () => {
  const NON_OBJECTS = [true, 123, '', [], {}, null, undefined, BigInt(123), Symbol('foo')];

  it('Is.automergeUrl', () => {
    const store = Store.init();
    const doc = store.repo.create();
    expect(Is.automergeUrl(doc.url)).to.eql(true);
    NON_OBJECTS.forEach((v) => expect(Is.automergeUrl(v)).to.eql(false));
  });

  it('Is.doc', async () => {
    type T = { count: number };
    NON_OBJECTS.forEach((v) => expect(Is.doc(v)).to.eql(false));
    const store = Store.init();
    const doc = await store.doc.getOrCreate<T>((d) => (d.count = 0));
    expect(Is.doc(doc)).to.eql(true);
    store.dispose();
  });

  it('Is.lens', async () => {
    type T = { child: { count: number } };
    NON_OBJECTS.forEach((v) => expect(Is.lens(v)).to.eql(false));
    const store = Store.init();
    const doc = await store.doc.getOrCreate<T>((d) => (d.child = { count: 0 }));
    const lens = Doc.lens(doc, ['child']);

    expect(Is.lens(doc)).to.eql(false);
    expect(Is.lens(lens)).to.eql(true);
    store.dispose();
  });

  it('Is.map | proxy', async () => {
    type T = { child: { count: number }; msg?: string };
    type M = { count: number; text: string };

    const store = Store.init();
    const doc1 = await store.doc.getOrCreate<T>((d) => (d.child = { count: 0 }));
    const doc2 = await store.doc.getOrCreate<T>((d) => (d.msg = ''));
    const map = Doc.map<M>({ count: [doc1, ['child', 'count']], text: [doc2, 'msg'] });

    NON_OBJECTS.forEach((v) => expect(Is.map(v)).to.eql(false));
    expect(Is.map(map)).to.eql(true);
    expect(Is.map(map.current)).to.eql(false);

    expect(Is.proxy(map)).to.eql(false);
    expect(Is.proxy(map.current)).to.eql(true);

    store.dispose();
  });

  it('Is.store', () => {
    const store = Store.init();
    expect(Is.store(store)).to.eql(true);
    NON_OBJECTS.forEach((value) => expect(Is.store(value)).to.eql(false));
    store.dispose();
  });

  it('Is.storeIndex', async () => {
    const store = Store.init();
    const index = await Store.Index.init(store);
    NON_OBJECTS.forEach((value) => expect(Is.storeIndex(value)).to.eql(false));
    expect(Is.storeIndex(index)).to.eql(true);
    store.dispose();
  });

  it('Is.webStore', () => {
    expect(Is.webStore(WebStore.init({ storage: false }))).to.eql(true);
    expect(Is.webStore(Store.init())).to.eql(false);
    NON_OBJECTS.forEach((value) => expect(Is.store(value)).to.eql(false));
  });

  it('Is.repoIndex', () => {
    const index: t.StoreIndexDoc = { ['.meta']: Store.Index.meta, docs: [] };
    expect(Is.repoIndex(index)).to.eql(true);
    NON_OBJECTS.forEach((v) => expect(Is.repoIndex(v)).to.eql(false));
  });

  it('Is.broadcastChannel (network adapter)', () => {
    const adapter = new BroadcastChannelNetworkAdapter();
    expect(Is.broadcastChannel(adapter)).to.eql(true);
    NON_OBJECTS.forEach((v) => expect(Is.broadcastChannel(v)).to.eql(false));
  });

  it('Is.namespace', async () => {
    type TRoot = { count: number };
    const store = Store.init();
    const doc = await store.doc.getOrCreate<TRoot>((d) => (d.count = 0));
    const ns = Doc.ns(doc);
    expect(Is.namespace(ns)).to.eql(true);
    NON_OBJECTS.forEach((value) => expect(Is.namespace(value)).to.eql(false));
    store.dispose();
  });

  it('Is.handle', async () => {
    type TRoot = { count: number };
    const store = Store.init();
    const docRef = await store.doc.getOrCreate<TRoot>((d) => (d.count = 0));
    const docRefHandle = docRef as t.DocWithHandle<TRoot>;
    expect(Is.handle(docRefHandle.handle)).to.eql(true);
    expect(Is.handle(docRef)).to.eql(false);
    NON_OBJECTS.forEach((value) => expect(Is.handle(value)).to.eql(false));
    store.dispose();
  });
});
