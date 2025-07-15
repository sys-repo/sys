import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';

import { type t, AutomergeRepo, describe, expect, it, rx, Time } from '../-test.ts';
import { Crdt } from '../m.Server/common.ts';
import { Server } from '../m.Server/mod.ts';
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
      const b = (await repo.get<T>(`automerge:${a.id}`)).doc!;
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

  describe('repo.events:', () => {
    it('events.dispose', async () => {
      const life = rx.lifecycle();
      const repo = Crdt.repo();
      const a = repo.events();
      const b = repo.events(life.dispose$);
      const c = repo.events();

      expect(a.disposed).to.eql(false);
      expect(b.disposed).to.eql(false);
      expect(c.disposed).to.eql(false);

      life.dispose();
      expect(a.disposed).to.eql(false);
      expect(b.disposed).to.eql(true);
      expect(c.disposed).to.eql(false);

      a.dispose();
      expect(a.disposed).to.eql(true);

      await repo.dispose();
      expect(c.disposed).to.eql(true);
    });

    describe('prop$ (change)', () => {
      it('enabled (toggle)', () => {
        const repo = Crdt.repo({ network: { ws: 'foo.com' } });
        const events = repo.events();

        const fired: t.CrdtRepoPropChangeEvent['payload'][] = [];
        events.prop$.subscribe((e) => fired.push(e));

        repo.sync.enabled = false; // ← trigger event.
        expect(fired.length).to.eql(1);

        expect(fired[0].before.id).to.eql(fired[0].after.id);
        expect(fired[0].before.sync.urls).to.eql(fired[0].after.sync.urls);
        expect(fired[0].before.sync.enabled).to.eql(true);
        expect(fired[0].after.sync.enabled).to.eql(false);

        repo.sync.enabled = true;
        expect(fired.length).to.eql(2);
        repo.sync.enabled = true;
        expect(fired.length).to.eql(2);
        events.dispose();

        repo.sync.enabled = false;
        expect(fired.length).to.eql(2); // no more events (disposed).

        console.log('fire', fired);
      });
    });

    describe('network$', () => {
      it('events: peer-online → peer-offline → peer-online → network-close', async () => {
        const s = await Server.ws({ silent: true });
        const ws = `localhost:${s.addr.port}`;

        const sFired: t.NetworkChangeEvent[] = [];
        const aFired: t.NetworkChangeEvent[] = [];
        const bFired: t.NetworkChangeEvent[] = [];

        const a = Crdt.repo({ network: { ws } });
        const b = Crdt.repo({ network: { ws } });

        s.repo.events().network$.subscribe((e) => sFired.push(e));
        a.events().network$.subscribe((e) => aFired.push(e));
        b.events().network$.subscribe((e) => bFired.push(e));

        // Both peers connect (online):
        await Time.wait(50);
        expect(sFired.length).to.eql(2);
        expect(sFired.map((e) => e.type)).to.eql(['peer-online', 'peer-online']);

        const peers = sFired
          .filter((e) => e.type === 'peer-online')
          .map((e) => e.payload.peerId as string);
        expect(peers.includes(a.id.peer)).to.be.true;
        expect(peers.includes(b.id.peer)).to.be.true;

        // Take peer-A offline:
        a.sync.enabled = false;
        await Time.wait(10);

        expect(sFired.length).to.eql(3);
        expect(aFired.length).to.eql(2);
        expect(bFired.length).to.eql(1);
        expect(sFired.map((e) => e.type).slice(-1)).to.eql(['peer-offline']);
        expect(aFired.map((e) => e.type).slice(-1)).to.eql(['peer-offline']);
        expect(bFired.map((e) => e.type).slice(-1)).to.eql(['peer-online']); // NB: no knowledge of the other peer.

        // Bring peer-A back online:
        a.sync.enabled = true;
        await Time.wait(10);

        expect(sFired.length).to.eql(4);
        expect(aFired.length).to.eql(3);
        expect(bFired.length).to.eql(1);

        type On = t.CrdtNetworkPeerOnline;
        type Off = t.CrdtNetworkPeerOffline;
        expect((sFired.slice(-1)[0].payload as On).peerId).to.eql(a.id.peer);
        expect((aFired.slice(-1)[0].payload as On).peerId).to.eql(s.repo.id.peer);

        // Take the server offline (lose connection):
        await s.dispose();
        await Time.wait(10);

        expect(sFired.length).to.eql(4); // NB: no change
        expect(aFired.length).to.eql(4);
        expect(bFired.length).to.eql(2);

        expect(aFired.map((e) => e.type).slice(-1)).to.eql(['peer-offline']);
        expect(bFired.map((e) => e.type).slice(-1)).to.eql(['peer-offline']);
        expect((aFired.slice(-1)[0].payload as Off).peerId).to.eql(s.repo.id.peer);
        expect((bFired.slice(-1)[0].payload as Off).peerId).to.eql(s.repo.id.peer);

        // Finish up.
        await a.dispose();
        await b.dispose();
      });
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
      const life = rx.lifecycle();
      const repo = Crdt.repo({ dispose$: life });
      expect(repo.disposed).to.eql(false);

      life.dispose();
      expect(repo.disposed).to.eql(false); // NB: async shutdown - not yet complete.

      await Time.wait(50);
      expect(repo.disposed).to.eql(true);
    });
  });
});
