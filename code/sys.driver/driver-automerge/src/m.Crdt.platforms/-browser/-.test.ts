import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb';
import { type t, describe, expect, it, slug, Time } from '../../-test.ts';
import { D } from './common.ts';
import { Crdt } from './mod.ts';

describe('Crdt: browser', { sanitizeResources: false, sanitizeOps: false }, () => {
  type T = { count: number };

  it('imports', async () => {
    const { Crdt } = await import('@sys/driver-automerge/browser');
    expect(Crdt.kind).to.eql('Crdt:Browser');

    const repoA = Crdt.repo({ storage: 'IndexedDb' });

    const a = repoA.create<T>({ count: 0 });
    a.change((d) => (d.count = 1234));

    await Time.wait(500);

    const repoB = Crdt.repo({ storage: new IndexedDBStorageAdapter(D.database) });
    const b = (await repoB.get<T>(a.id)).doc!;
    expect(b.current).to.eql({ count: 1234 }); // NB: read from IndexedDb.
  });

  it('named IndexedDB database', async () => {
    const database = `foo-${slug()}`;
    const repoA = Crdt.repo({ storage: { database } });
    const repoB = Crdt.repo({ storage: {} });

    const doc = repoA.create<T>({ count: 1234 });
    await Time.wait(10);

    const assertExists = async (repo: t.CrdtRepo, exists: boolean) => {
      const res = (await repo.get(doc.id)).doc;
      expect(!!res === exists).to.be.true;
    };
    await assertExists(repoA, true);
    await assertExists(repoB, false); // NB: in a differently named repo.

    // Examine the underlying InexedDB and ensure the custom name was used.
    const dbs = await indexedDB.databases?.();
    const names = dbs.map(({ name }) => name);

    expect(names).to.include(D.database);
    expect(names).to.include(database);
  });

  it('repo.id', () => {
    const a = Crdt.repo();
    const b = Crdt.repo({ network: { ws: 'sync.db.team' } });

    expect(a.id.instance).to.be.a('string');
    expect(a.id.instance).to.not.eql(b.id.instance);

    expect(a.id.peer).to.eql(''); // ← no network...no peer-id.
    expect(b.id.peer.startsWith('peer.')).to.be.true;
  });

  it('Crdt.Url.ws', () => {
    const url = Crdt.Url.ws('sync.db.team');
    expect(url).to.eql('wss://sync.db.team');
  });
});
