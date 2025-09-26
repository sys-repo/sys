import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';
import { type t, AutomergeRepo, describe, expect, it, Rx, Time } from '../-test.ts';

import { Crdt } from '../m.Server/common.ts';
import { toAutomergeRepo, toRepo } from './mod.ts';

describe('CrdtRepo', { sanitizeResources: false, sanitizeOps: false }, () => {
  type T = { count: number };

  it('toAutomergeRepo', () => {
    const base = new AutomergeRepo();
    const repo = toRepo(base);
    expect(toAutomergeRepo(repo)).to.equal(base);
    expect(toAutomergeRepo()).to.eql(undefined);
    expect(toAutomergeRepo({} as any)).to.eql(undefined);
  });

  describe('create factory (toRepo)', () => {
    it('create (doc)', () => {
      const repo = toRepo(new AutomergeRepo());
      expect(repo.id.peer).to.eql('');
      expect(repo.id.instance).to.be.a('string');
      expect(repo.disposed).to.eql(false);

      const initial = { count: 0 };
      const doc = repo.create<T>(initial);
      expect(doc.current).to.eql(initial);
      expect(doc.current).to.not.equal(initial);
    });

    it('create (doc) → initial as function', () => {
      const repo = toRepo(new AutomergeRepo());
      const initial: T = { count: 1234 };
      const doc = repo.create<T>(() => initial);
      expect(doc.current).to.eql(initial);
      expect(doc.current).to.not.equal(initial);
    });

    it('creates with { peerId }', () => {
      const network = [new BrowserWebSocketClientAdapter('wss://sync.db.team')];
      const peerId = 'foo:bar';
      const a = toRepo(new AutomergeRepo(), { peerId });
      const b = toRepo(new AutomergeRepo({ network }), { peerId });
      expect(a.id.peer).to.eql(''); // NB: no network.
      expect(b.id.peer).to.eql(peerId);
    });

    it('create via `Crdt.repo` API', () => {
      const repo = Crdt.repo();
      const initial = { count: 0 };
      const doc = repo.create<T>(initial);
      expect(doc.current).to.eql(initial);
      expect(doc.current).to.not.equal(initial);
      expect(repo.disposed).to.eql(false);
    });

    describe('initial seed property on document', () => {
      it('create seeds empty initial with $meta.createdAt', () => {
        const repo = toRepo(new AutomergeRepo());
        const a = repo.create<{}>({}); // empty
        const b = repo.create<{ count: number }>({ count: 1 }); // non-empty
        expect(typeof (a.current as any).$meta?.createdAt).to.eql('number');
        expect((b.current as any).$meta).to.eql(undefined);
      });

      it('seeded empty doc is durable immediately', async () => {
        const base = new AutomergeRepo();
        const repoA = toRepo(base);
        const doc = repoA.create<{}>({});

        const repoB = toRepo(base);
        const got = await repoB.get<{}>(doc.id);
        expect(!!got.doc).to.eql(true);
      });

      it('does not override existing props in non-empty initial', () => {
        const repo = toRepo(new AutomergeRepo());
        const initial = { title: 'hello' };
        const doc = repo.create(initial);

        expect(doc.current).to.eql(initial); //                  ← Doc retains its properties unchanged.
        expect((doc.current as any).$meta).to.eql(undefined); // ← No $meta was injected.
      });

      it('does not clobber an explicit $meta passed by caller', () => {
        const repo = toRepo(new AutomergeRepo());
        const explicit = { $meta: { createdAt: 42, note: 'manual' } };
        const doc = repo.create(explicit);

        // Original $meta preserved exactly as given:
        expect(doc.current.$meta).to.eql(explicit.$meta);
      });
    });
  });

  describe('ready', () => {
    it('ready flag + whenReady() (no network)', async () => {
      const repo = Crdt.repo();
      expect(repo.ready).to.eql(false);

      // Await ready.
      await repo.whenReady();
      expect(repo.ready).to.eql(true);

      // Second call should resolve immediately.
      await repo.whenReady();
      expect(repo.ready).to.eql(true);
    });

    it('ready$ emits once and completes', async () => {
      const repo = Crdt.repo();

      const values: boolean[] = [];
      let completed = false;

      repo.events().ready$.subscribe({
        next: (v) => values.push(v),
        complete: () => (completed = true),
      });

      await repo.whenReady();

      expect(values).to.eql([true]);
      expect(completed).to.eql(true);
    });

    it('whenReady waits for adapter.whenReady()', async () => {
      class SlowAdapter {
        url = 'wss://example';
        async whenReady() {
          await Time.wait(20);
        }
        connect() {}
        disconnect() {}
        on() {}
        off() {}
      }

      const repo = Crdt.repo({ network: [new SlowAdapter() as any] });
      const t0 = Date.now();

      await repo.whenReady();
      const dt = Date.now() - t0;

      expect(repo.ready).to.eql(true);
      expect(dt).to.be.at.least(15);
    });
  });

  describe('repo.get', () => {
    it('get', async () => {
      const base = new AutomergeRepo();
      const repoA = toRepo(base);
      const repoB = toRepo(base);
      const a = repoA.create<T>({ count: 0 });
      expect(a.current).to.eql({ count: 0 });

      const b = (await repoB.get<T>(` ${a.id}   `)).doc!; // NB: test input address cleanup.
      expect(a).to.not.equal(b); // NB: difference repo (not-cached).
      expect(a.id).to.eql(b.id);
      expect(a.instance).to.not.eql(b.instance);

      a.change((d) => (d.count = 1234));
      expect(b.current.count).to.eql(1234);
    });

    it('get: automerge-URL', async () => {
      const repo = toRepo(new AutomergeRepo());
      const a = repo.create<T>({ count: 0 });
      const b = (await repo.get<T>(`  automerge:${a.id}  `)).doc!;
      expect(b.instance).to.not.eql(a.instance);
      expect(b.id).to.eql(a.id);
      expect(b.current).to.eql({ count: 0 });
    });

    it('get: "crdt:<docid> URI', async () => {
      const repo = toRepo(new AutomergeRepo());
      const a = repo.create<T>({ count: 0 });
      const b = (await repo.get<T>(`  crdt:${a.id}  `)).doc!;
      expect(b.instance).to.not.eql(a.instance);
      expect(b.id).to.eql(a.id);
      expect(b.current).to.eql({ count: 0 });
    });

    it('sync between different doc/ref instances', async () => {
      const base = new AutomergeRepo();
      const repoA = toRepo(base);
      const repoB = toRepo(base);
      const a = repoA.create<T>({ count: 0 });
      const b = (await repoB.get<T>(a.id)).doc!;
      expect(a.instance).to.not.eql(b.instance);

      expect(a).to.not.equal(b);
      expect(a.current).to.eql(b.current);

      a.change((d) => d.count++);
      expect(a.current).to.eql(b.current);
    });
  });

  describe('repo.delete', () => {
    it('removes document (before ready)', async () => {
      const repo = Crdt.repo();
      const doc = repo.create<T>({ count: 0 });
      expect(doc.deleted).to.eql(false);
      expect(doc.disposed).to.eql(false);

      await repo.delete(doc);
      expect(doc.deleted).to.eql(true);
      expect(doc.disposed).to.eql(true);

      await repo.delete(doc); // NB: safely no-op after deleted.
    });

    it('removes document (after ready) - multiple refs', async () => {
      const repo = Crdt.repo();
      const a = repo.create<T>({ count: 0 });
      const b = (await repo.get<T>(a.id)).doc;
      expect(a.deleted).to.eql(false);
      expect(b?.deleted).to.eql(false);

      await repo.delete(a);
      expect(a.deleted).to.eql(true);
      expect(b?.deleted).to.eql(true);
    });

    it('fires deleted event from document', async () => {
      const repo = Crdt.repo();
      const doc = repo.create<T>({ count: 0 });
      expect(doc.deleted).to.eql(false);

      const fired: t.CrdtDeleted[] = [];
      doc.events().deleted$.subscribe((e) => fired.push(e));

      const id = doc.id;
      await repo.delete(id);
      expect(doc.deleted).to.eql(true);
      expect(doc.disposed).to.eql(true);
    });
  });

  describe('sync (network)', () => {
    const createAdapters = () => {
      const net1 = new BrowserWebSocketClientAdapter('wss://sync.automerge.org');
      const net2 = new BrowserWebSocketClientAdapter('wss://sync.db.team');
      return { net1, net2 } as const;
    };

    it('sync.urls', () => {
      const { net1, net2 } = createAdapters();

      const a = toRepo(new AutomergeRepo({}));
      const b = toRepo(new AutomergeRepo({ network: [net1] }));
      const c = toRepo(new AutomergeRepo({ network: [net1, net2] }));

      expect(a.sync.urls).to.eql([]);
      expect(b.sync.urls).to.eql(['wss://sync.automerge.org']);
      expect(c.sync.urls).to.eql(['wss://sync.automerge.org', 'wss://sync.db.team']);

      expect(a.sync.enabled).to.eql(false);
      expect(b.sync.enabled).to.eql(true);
      expect(c.sync.enabled).to.eql(true);
    });

    it('can never be enbled when no networks', () => {
      const { net1 } = createAdapters();
      const a = toRepo(new AutomergeRepo({}));
      const b = toRepo(new AutomergeRepo({ network: [net1] }));

      expect(a.sync.enabled).to.eql(false);
      expect(b.sync.enabled).to.eql(true);

      a.sync.enabled = true;
      expect(a.sync.enabled).to.eql(false);
    });
  });

  describe('errors', () => {
    it('control: ensure monkey-patching is non-destructive', () => {
      const a = new AutomergeRepo();
      const b = new AutomergeRepo();
      (a as any).find = 0;
      expect(a.find).to.not.equal(b.find);
      expect(typeof b.find === 'function').to.be.true;
    });

    it('error: NotFound', async () => {
      const repo = toRepo(new AutomergeRepo());
      const res = await repo.get('Juwryn74i3Aia5Kb529XUm3hU4Y');
      expect(res.doc).to.eql(undefined);
      expect(res.error?.kind === 'NotFound').to.be.true;
      expect(res.error?.message).to.include('Document Juwryn74i3Aia5Kb529XUm3hU4Y is unavailable');
    });

    it('error: Timeout', async () => {
      const base = new AutomergeRepo();
      const repo = toRepo(base);

      // Monkey-patch the internal `find` method to simulate a too long retrieval.
      (base as any).find = async () => Time.wait(50_000);

      const res = await repo.get('Juwryn74i3Aia5Kb529XUm3hU4Y', { timeout: 5 });
      expect(res.error?.kind === 'Timeout').to.be.true;
      expect(res.error?.message).to.include('Timed out retrieving document');
    });

    it('error: UNKNOWN - bork the repo', async () => {
      const base = new AutomergeRepo();
      const error = '💥 test explosion';

      // Monkey-patch the internal `find` method to simulate failure.
      (base as any).find = () => {
        throw new Error(error);
      };

      const repo = toRepo(base);
      const res = await repo.get('Juwryn74i3Aia5Kb529XUm3hU4Y');

      expect(res.error?.message).to.eql(error);
      expect(res.error?.kind === 'UNKNOWN').to.be.true;
    });
  });

  describe('dispose (shutdown)', () => {
    it('dispose from async method', async () => {
      const repo = Crdt.repo();
      expect(repo.disposed).to.eql(false);

      const fired: t.DisposeAsyncEvent[] = [];
      repo.dispose$.subscribe((e) => fired.push(e));

      await repo.dispose();
      await repo.dispose();
      await repo.dispose(); // NB: only called once.

      expect(fired.length).to.eql(2);
      expect(fired[1].payload.is.done).to.eql(true);
      expect(repo.disposed).to.eql(true);
    });

    it('dispose from parameter observable', async () => {
      const life = Rx.lifecycle();
      const repo = Crdt.repo({ dispose$: life });
      expect(repo.disposed).to.eql(false);

      life.dispose();
      expect(repo.disposed).to.eql(false); // NB: async shutdown - not yet complete.

      await Time.wait(50);
      expect(repo.disposed).to.eql(true);
    });
  });
});
