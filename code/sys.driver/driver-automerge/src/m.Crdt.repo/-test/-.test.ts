import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';
import { type t, AutomergeRepo, describe, expect, it, Rx, Time } from '../../-test.ts';

import { Crdt } from '../../m.Server/common.ts';
import { toAutomergeRepo, toRepo } from '../mod.ts';

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
    it('create (doc)', async () => {
      const repo = toRepo(new AutomergeRepo());
      expect(repo.id.peer).to.eql('');
      expect(repo.id.instance).to.be.a('string');
      expect(repo.disposed).to.eql(false);

      const initial = { count: 0 };
      const { ok, doc, error } = await repo.create<T>(initial);
      expect(ok).to.be.true;
      if (error) throw error;

      expect(doc.current).to.eql(initial);
      expect(doc.current).to.not.equal(initial);
    });

    it('create (doc) → initial as function', async () => {
      const repo = toRepo(new AutomergeRepo());
      const initial: T = { count: 1234 };
      const { doc, error } = await repo.create<T>(() => initial);
      if (error) throw error;
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

    it('create via `Crdt.repo` API', async () => {
      const repo = Crdt.repo();
      const initial = { count: 0 };
      const { doc, error } = await repo.create<T>(initial);
      if (error) throw error;

      expect(doc.current).to.eql(initial);
      expect(doc.current).to.not.equal(initial);
      expect(repo.disposed).to.eql(false);
    });

    describe('initial seed property on document', () => {
      it('create seeds empty initial with `.meta.createdAt`', async () => {
        const repo = toRepo(new AutomergeRepo());
        const a = await repo.create<{}>({}); // empty
        const b = await repo.create<{ count: number }>({ count: 1 }); // non-empty
        expect(typeof (a.doc!.current as any)['.meta']?.createdAt).to.eql('number');
        expect((b.doc!.current as any)['.meta']).to.eql(undefined);
      });

      it('seeded empty doc is durable immediately', async () => {
        const base = new AutomergeRepo();
        const repoA = toRepo(base);
        const { doc, error } = await repoA.create<{}>({});
        if (error) throw error;

        const repoB = toRepo(base);
        const got = await repoB.get<{}>(doc.id);
        expect(!!got.doc).to.eql(true);
      });

      it('does not override existing props in non-empty initial', async () => {
        const repo = toRepo(new AutomergeRepo());
        const initial = { title: 'hello' };
        const { doc, error } = await repo.create(initial);
        if (error) throw error;

        expect(doc.current).to.eql(initial);
        expect((doc.current as any)['.meta']).to.eql(undefined);
      });

      it('does not clobber an explicit `.meta` passed by caller', async () => {
        const repo = toRepo(new AutomergeRepo());
        const explicit = { ['.meta']: { createdAt: 42, note: 'manual' } };
        const { doc, error } = await repo.create(explicit);
        if (error) throw error;

        expect(doc.current['.meta']).to.eql(explicit['.meta']);
      });
    });
  });

  describe('ready', () => {
    it('ready flag + whenReady() (no network)', async () => {
      const repo = Crdt.repo();

      expect(repo.status.ready).to.eql(false);
      const initialStatus = repo.status;
      expect(initialStatus.stalled).to.eql(false);

      const readyRepo = await repo.whenReady();
      expect(repo.status.ready).to.eql(true);
      expect(readyRepo).to.equal(repo);

      const statusAfterReady = repo.status;
      expect(statusAfterReady.stalled).to.eql(false);

      await repo.whenReady();
      expect(repo.status.ready).to.eql(true);
    });

    it('status (core defaults)', () => {
      const repo = Crdt.repo();
      const status = repo.status;

      expect(status.stalled).to.eql(false);
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

      expect(repo.status.ready).to.eql(true);
      expect(dt).to.be.at.least(15);
    });
  });

  describe('repo.get', () => {
    it('get', async () => {
      const base = new AutomergeRepo();
      const repoA = toRepo(base);
      const repoB = toRepo(base);
      const a = await repoA.create<T>({ count: 0 });
      expect(a.doc!.current).to.eql({ count: 0 });

      const b = await repoB.get<T>(` ${a.doc!.id}   `);
      expect(a).to.not.equal(b);
      expect(a.doc!.id).to.eql(b.doc!.id);
      expect(a.doc!.instance).to.not.eql(b.doc!.instance);

      a.doc!.change((d) => (d.count = 1234));
      expect(b.doc!.current.count).to.eql(1234);
    });

    it('get: automerge-URL', async () => {
      const repo = toRepo(new AutomergeRepo());
      const a = await repo.create<T>({ count: 0 });
      const b = await repo.get<T>(`  automerge:${a.doc!.id}  `);
      expect(b.doc!.instance).to.not.eql(a.doc!.instance);
      expect(b.doc!.id).to.eql(a.doc!.id);
      expect(b.doc!.current).to.eql({ count: 0 });
    });

    it('get: "crdt:<docid> URI', async () => {
      const repo = toRepo(new AutomergeRepo());
      const a = await repo.create<T>({ count: 0 });
      const b = await repo.get<T>(`  crdt:${a.doc!.id}  `);
      expect(b.doc!.instance).to.not.eql(a.doc!.instance);
      expect(b.doc!.id).to.eql(a.doc!.id);
      expect(b.doc!.current).to.eql({ count: 0 });
    });

    it('sync between different doc/ref instances', async () => {
      const base = new AutomergeRepo();
      const repoA = toRepo(base);
      const repoB = toRepo(base);
      const a = await repoA.create<T>({ count: 0 });
      const b = await repoB.get<T>(a.doc!.id);
      expect(a.doc!.instance).to.not.eql(b.doc!.instance);

      expect(a).to.not.equal(b);
      expect(a.doc!.current).to.eql(b.doc!.current);

      a.doc!.change((d) => d.count++);
      expect(a.doc!.current).to.eql(b.doc!.current);
    });
  });

  describe('repo.delete', () => {
    it('removes document (before ready)', async () => {
      const repo = Crdt.repo();
      const { doc, error } = await repo.create<T>({ count: 0 });
      if (error) throw error;
      expect(doc.deleted).to.eql(false);
      expect(doc.disposed).to.eql(false);

      await repo.delete(doc);
      expect(doc.deleted).to.eql(true);
      expect(doc.disposed).to.eql(true);

      await repo.delete(doc);
    });

    it('removes document (after ready) - multiple refs', async () => {
      const repo = Crdt.repo();
      const a = await repo.create<T>({ count: 0 });
      const b = await repo.get<T>(a.doc!.id);
      expect(a.doc!.deleted).to.eql(false);
      expect(b?.doc!.deleted).to.eql(false);

      await repo.delete(a.doc!);
      expect(a.doc!.deleted).to.eql(true);
      expect(b?.doc!.deleted).to.eql(true);
    });

    it('fires deleted event from document', async () => {
      const repo = Crdt.repo();
      const { doc, error } = await repo.create<T>({ count: 0 });
      if (error) throw error;

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

      expect(a.sync.enabled).to.eql(null);
      expect(b.sync.enabled).to.eql(true);
      expect(c.sync.enabled).to.eql(true);
    });

    it('can never be enbled when no networks', () => {
      const { net1 } = createAdapters();
      const a = toRepo(new AutomergeRepo({}));
      const b = toRepo(new AutomergeRepo({ network: [net1] }));

      expect(a.sync.enabled).to.eql(null);
      expect(b.sync.enabled).to.eql(true);

      a.sync.enable();
      b.sync.enable(false);
      expect(a.sync.enabled).to.eql(null);
      expect(b.sync.enabled).to.eql(false);
    });
  });

  describe('stores (persistence)', () => {
    it('has an empty stores list', () => {
      const repo = toRepo(new AutomergeRepo({}));
      expect(repo.stores).to.eql([]);
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
      expect(res.ok).to.eql(false);
      expect(res.doc).to.eql(undefined);
      expect(res.error?.kind === 'NotFound').to.be.true;
      expect(res.error?.message).to.include('Document Juwryn74i3Aia5Kb529XUm3hU4Y is unavailable');
    });

    it('error: Timeout', async () => {
      const base = new AutomergeRepo();
      const repo = toRepo(base);

      (base as any).find = async () => Time.wait(50_000);

      const res = await repo.get('Juwryn74i3Aia5Kb529XUm3hU4Y', { timeout: 5 });
      expect(res.ok).to.eql(false);
      expect(res.error?.kind === 'Timeout').to.be.true;
      expect(res.error?.message).to.include('Timed out retrieving document');
    });

    it('error: UNKNOWN - bork the repo', async () => {
      const base = new AutomergeRepo();
      const error = '💥 test explosion';

      (base as any).find = () => {
        throw new Error(error);
      };

      const repo = toRepo(base);
      const res = await repo.get('Juwryn74i3Aia5Kb529XUm3hU4Y');

      expect(res.ok).to.eql(false);
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
      await repo.dispose();

      expect(fired.length).to.eql(2);
      expect(fired[1].payload.is.done).to.eql(true);
      expect(repo.disposed).to.eql(true);
    });

    it('dispose from parameter observable', async () => {
      const until = Rx.lifecycle();
      const repo = Crdt.repo({ until });
      expect(repo.disposed).to.eql(false);

      until.dispose();
      expect(repo.disposed).to.eql(false);

      await Time.wait(50);
      expect(repo.disposed).to.eql(true);
    });
  });
});
