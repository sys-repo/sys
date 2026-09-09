import 'fake-indexeddb/auto';
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb';

import {
  afterAll,
  describe,
  expect,
  it,
  repoCleanup,
  slug,
  type t,
  Testing,
  Time,
} from '../../-test.ts';
import { D } from './common.ts';
import { Crdt } from './mod.ts';

describe(
  'Crdt: web/browser',
  {
    // @automerge/automerge-repo-network-websocket@2.5.6 owns uncancellable readiness timers
    // started by the public {ws} shorthand. Deno 2.9 reports these timers while either signal is
    // enabled; suite teardown still closes every repo and resource, and exit policy stays active.
    sanitizeOps: false,
    sanitizeResources: false,
  },
  () => {
    const Repos = repoCleanup(afterAll);
    type T = { count: number };

    describe('Crdt.repo', () => {
      it('imports', async () => {
        const { Crdt } = await import('@sys/driver-automerge/web');
        expect(Crdt.kind).to.eql('crdt:web');

        // Smoke-level: verify we can construct repos with the two storage forms.
        const repoA = Repos.crdt(Crdt.repo({ storage: 'IndexedDb' }));
        const repoB = Repos.crdt(
          Crdt.repo({ storage: new IndexedDBStorageAdapter(D.database) }),
        );

        expect(repoA).to.exist;
        expect(repoB).to.exist;
        // NB: Deep IndexedDB semantics (persist/read) are covered by -automerge.raw.tests/-idb.test.ts
      });

      it('named IndexedDB database', async () => {
        await Testing.retry(5, async () => {
          const database = `foo-${slug()}`;
          const repoA = Repos.crdt(Crdt.repo({ storage: { database } }));
          const repoB = Repos.crdt(Crdt.repo({ storage: {} }));

          expect(repoA.stores).to.eql([{ kind: 'indexed-db', database, store: D.store }]);
          expect(repoB.stores).to.eql([]);

          const { doc, error } = await repoA.create<T>({ count: 1234 });
          if (error) throw error;
          await Time.wait(10);

          const assertExists = async (repo: t.CrdtRepo, exists: boolean) => {
            const res = (await repo.get(doc.id)).doc;
            expect(!!res === exists).to.be.true;
          };
          await assertExists(repoA, true);
          await assertExists(repoB, false); // NB: in a differently named repo.
        });
      });

      it('repo.id', () => {
        const a = Repos.crdt(Crdt.repo());
        const b = Repos.crdt(Crdt.repo({ network: { ws: 'sync.automerge.org' } }));

        expect(a.id.instance).to.be.a('string');
        expect(a.id.instance).to.not.eql(b.id.instance);

        expect(a.id.peer).to.eql(''); // ← no network...no peer-id.
        expect(b.id.peer.startsWith('peer-')).to.be.true;
      });

      it('repo: network with <Falsy> in it', () => {
        const repo = Repos.crdt(Crdt.repo({
          network: [{ ws: 'sync.automerge.org' }, undefined, null, false, 0, ''],
        }));
        expect(repo.id.peer.startsWith('peer-')).to.be.true;
        expect(repo.sync.urls).to.eql(['wss://sync.automerge.org']); // NB: the <undefined> entry filtered out.
      });
    });

    it('Crdt.Url.ws', () => {
      const url = Crdt.Url.ws('sync.automerge.org');
      expect(url).to.eql('wss://sync.automerge.org');
    });
  },
);
