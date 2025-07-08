import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';

import { type t, AutomergeRepo, describe, expect, it, rx, Time } from '../-test.ts';
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

  describe('create', () => {
    it('create (doc)', () => {
      const repo = toRepo(new AutomergeRepo());
      expect(repo.id.peer).to.eql('');
      expect(repo.id.instance).to.be.a('string');

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

    it('creates with  { peerId }', () => {
      const network = [new BrowserWebSocketClientAdapter('wss://sync.db.team')];
      const peerId = 'foo:bar';
      const a = toRepo(new AutomergeRepo(), { peerId });
      const b = toRepo(new AutomergeRepo({ network }), { peerId });
      expect(a.id.peer).to.eql(''); // NB: no network.
      expect(b.id.peer).to.eql(peerId);
    });

    it('create from `Crdt.repo` API', () => {
      const repo = Crdt.repo();
      const initial = { count: 0 };
      const doc = repo.create<T>(initial);
      expect(doc.current).to.eql(initial);
      expect(doc.current).to.not.equal(initial);
    });
  });

  describe('get', () => {
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

  describe('events:', () => {
    it('events.dispose', () => {
      const life = rx.lifecycle();
      const repo = Crdt.repo();
      const a = repo.events();
      const b = repo.events(life.dispose$);

      expect(a.disposed).to.eql(false);
      expect(b.disposed).to.eql(false);

      life.dispose();
      expect(a.disposed).to.eql(false);
      expect(b.disposed).to.eql(true);

      a.dispose();
      expect(a.disposed).to.eql(true);
    });

    it('events.sync$', () => {
      const repo = Crdt.repo({ network: { ws: 'sync.db.team' } });
      const events = repo.events();

      const fired: t.CrdtRepoChange[] = [];
      events.$.subscribe((e) => fired.push(e));

      repo.sync.enabled = false; // ← trigger event
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
});
