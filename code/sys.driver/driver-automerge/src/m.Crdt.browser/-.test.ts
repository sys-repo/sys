import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb';
import { IndexedDb } from '@sys/std/indexeddb';

import { type t, describe, expect, it, slug, Time, Err } from '../-test.ts';
import { D, toAutomergeHandle } from './common.ts';
import { Crdt } from './mod.ts';

describe('Crdt: browser', { sanitizeResources: false, sanitizeOps: false }, () => {
  type T = { count: number };

  it('imports', async () => {
    const { Crdt } = await import('@sys/driver-automerge/browser');
    expect(Crdt.kind).to.eql('Crdt:Browser');

    const repoA = Crdt.repo({ storage: 'IndexedDb' });
    expect(repoA.id.peer.startsWith('peer.')).to.be.true;

    const a = repoA.create<T>({ count: 0 });
    a.change((d) => (d.count = 1234));

    await Time.wait(500);

    const repoB = Crdt.repo({ storage: new IndexedDBStorageAdapter(D.database) });
    const b = (await repoB.get<T>(a.id))!;
    expect(b.current).to.eql({ count: 1234 }); // NB: read from IndexedDb.
  });

  it('named IndexedDB database', async () => {
    const database = `foo-${slug()}`;
    const repoA = Crdt.repo({ storage: { database } });
    const repoB = Crdt.repo({ storage: {} });

    const doc = repoA.create<T>({ count: 1234 });
    await Time.wait(10);

    const assertExists = async (repo: t.CrdtRepo, exists: boolean) => {
      const res = await repo.get(doc.id);
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
});
