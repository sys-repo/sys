import { type t, describe, expect, it, Rx, Time } from '../-test.ts';
import { Crdt } from '../m.Server/common.ts';
import { Server } from '../m.Server/mod.ts';

describe('CrdtRepo', { sanitizeResources: false, sanitizeOps: false }, () => {
  it('events.dispose', async () => {
    const life = Rx.lifecycle();
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

  describe('ready$', () => {
    it('fires prop-change when repo becomes ready', async () => {
      const repo = Crdt.repo();
      const events = repo.events();

      const fired: t.CrdtRepoPropChange[] = [];
      events.prop$.subscribe((e) => fired.push(e));

      // Initially: not ready.
      expect(repo.ready).to.eql(false);

      // Await readiness:
      await repo.whenReady();

      // Repo is now ready.
      expect(repo.ready).to.eql(true);

      // Should have fired exactly one "ready" change:
      const readyChanges = fired.filter((c) => c.prop === 'ready');
      expect(readyChanges.length).to.eql(1);
      expect(readyChanges[0].before.ready).to.eql(false);
      expect(readyChanges[0].after.ready).to.eql(true);

      events.dispose();
    });

    it('ready$ emits once and completes', async () => {
      const repo = Crdt.repo();
      const events = repo.events();

      const values: boolean[] = [];
      let completed = false;

      events.ready$.subscribe({
        next: (v) => values.push(v),
        complete: () => (completed = true),
      });

      await repo.whenReady();

      expect(values).to.eql([true]); //   ← one-shot emission
      expect(completed).to.eql(true); //  ← and it completes
      events.dispose();
    });
  });

  describe('prop$ (change)', () => {
    it('sync.enabled (toggle)', async () => {
      const s = await Server.ws({ silent: true });
      const ws = `localhost:${s.addr.port}`;

      const repo = Crdt.repo({ network: { ws } });
      await repo.whenReady(); // avoid racing adapter bring-up

      const events = repo.events();
      const next = () => Rx.firstValueFrom(events.prop$.pipe(Rx.take(1)));

      // 1) disable → expect one prop-change
      const p1 = next();
      repo.sync.enabled = false;
      const e1 = await p1;

      expect(e1.before.id).to.eql(e1.after.id);
      expect(e1.before.sync.urls).to.eql(e1.after.sync.urls);
      expect(e1.before.sync.enabled).to.eql(true);
      expect(e1.after.sync.enabled).to.eql(false);

      // 2) enable → expect second prop-change
      const p2 = next();
      repo.sync.enabled = true;
      const e2 = await p2;

      expect(e2.before.sync.enabled).to.eql(false);
      expect(e2.after.sync.enabled).to.eql(true);

      // 3) no-op toggle shouldn’t emit
      const fired: (typeof e1)[] = [];
      const sub = events.prop$.subscribe((e) => fired.push(e));
      repo.sync.enabled = true; // no-op
      await Time.delay(); // one microtask hop
      expect(fired.length).to.eql(0);
      sub.unsubscribe();

      // 4) after dispose, no more events
      events.dispose();
      repo.sync.enabled = false;
      await Time.delay();
      expect(fired.length).to.eql(0);

      await repo.dispose();
      await s.dispose();
    });

    it('sync.peers', async () => {
      const s = await Server.ws({ silent: true });
      const ws = `localhost:${s.addr.port}`;

      const a = Crdt.repo({ network: { ws } });
      const b = Crdt.repo({ network: { ws } });

      const firedA: t.CrdtRepoPropChange[] = [];
      const firedB: t.CrdtRepoPropChange[] = [];
      a.events().prop$.subscribe((e) => firedA.push(e));
      b.events().prop$.subscribe((e) => firedB.push(e));

      expect(s.repo.sync.peers).to.eql([]);
      expect(a.sync.peers).to.eql([]);
      expect(b.sync.peers).to.eql([]);

      // Wait for initial peer connections:
      await Time.wait(150);
      expect(a.sync.peers).to.eql([s.repo.id.peer]);
      expect(b.sync.peers).to.eql([s.repo.id.peer]);
      expect(s.repo.sync.peers).to.have.members([a.id.peer, b.id.peer]);

      const peerChangesA = firedA.filter((c) => c.prop === 'sync.peers');
      const peerChangesB = firedB.filter((c) => c.prop === 'sync.peers');

      expect(peerChangesA.length).to.eql(1);
      expect(peerChangesB.length).to.eql(1);

      expect(peerChangesA[0].before.sync.peers).to.eql([]);
      expect(peerChangesA[0].after.sync.peers).to.eql([s.repo.id.peer]);
      expect(peerChangesB[0].before.sync.peers).to.eql([]);
      expect(peerChangesB[0].after.sync.peers).to.eql([s.repo.id.peer]);

      // Take A offline:
      a.sync.enabled = false;
      await Time.wait(100);
      expect(a.sync.peers).to.eql([]);
      expect(b.sync.peers).to.eql([s.repo.id.peer]);
      expect(s.repo.sync.peers).to.eql([b.id.peer]);

      // Only check peer-change events (ignore ready, enabled, etc.):
      const lastPeerA = peerChangesA
        .concat(firedA.filter((e) => e.prop === 'sync.peers'))
        .slice(-1)[0];
      const lastPeerB = peerChangesB
        .concat(firedB.filter((e) => e.prop === 'sync.peers'))
        .slice(-1)[0];

      expect(lastPeerA.before.sync.peers).to.eql([s.repo.id.peer]);
      expect(lastPeerA.after.sync.peers).to.eql([]);
      expect(lastPeerB.before.sync.peers).to.eql([]);
      expect(lastPeerB.after.sync.peers).to.eql([s.repo.id.peer]);

      // Bring A back online:
      a.sync.enabled = true;
      await Time.wait(100);
      expect(a.sync.peers).to.eql([s.repo.id.peer]);
      expect(b.sync.peers).to.eql([s.repo.id.peer]);
      expect(s.repo.sync.peers).to.have.members([a.id.peer, b.id.peer]);

      const backOnlineA = firedA.filter((e) => e.prop === 'sync.peers').slice(-1)[0];
      expect(backOnlineA.before.sync.peers).to.eql([]);
      expect(backOnlineA.after.sync.peers).to.eql([s.repo.id.peer]);

      // Kill the server:
      await s.dispose();
      await Time.wait(100);
      expect(a.sync.peers).to.eql([]);
      expect(b.sync.peers).to.eql([]);
      expect(s.repo.sync.peers).to.eql([]);

      const finalPeerA = firedA.filter((e) => e.prop === 'sync.peers').slice(-1)[0];
      const finalPeerB = firedB.filter((e) => e.prop === 'sync.peers').slice(-1)[0];
      expect(finalPeerA.before.sync.peers).to.eql([s.repo.id.peer]);
      expect(finalPeerA.after.sync.peers).to.eql([]);
      expect(finalPeerB.before.sync.peers).to.eql([s.repo.id.peer]);
      expect(finalPeerB.after.sync.peers).to.eql([]);

      // Finish up.
      await a.dispose();
      await b.dispose();
    });
  });

  describe('network$', () => {
    it('events: peer-online → peer-offline → network-close', async () => {
      const s = await Server.ws({ silent: true });
      const ws = `localhost:${s.addr.port}`;
      const a = Crdt.repo({ network: { ws } });
      const b = Crdt.repo({ network: { ws } });

      const sFired: t.CrdtNetworkChangeEvent[] = [];
      const aFired: t.CrdtNetworkChangeEvent[] = [];
      const bFired: t.CrdtNetworkChangeEvent[] = [];
      s.repo.events().network$.subscribe((e) => sFired.push(e));
      a.events().network$.subscribe((e) => aFired.push(e));
      b.events().network$.subscribe((e) => bFired.push(e));

      // Both peers connect (online):
      await Time.wait(300);
      expect(sFired.length).to.eql(2);
      expect(sFired.map((e) => e.type)).to.eql(['network/peer-online', 'network/peer-online']);

      const peers = sFired
        .filter((e) => e.type === 'network/peer-online')
        .map((e) => e.payload.peerId as string);
      expect(peers.includes(a.id.peer)).to.be.true;
      expect(peers.includes(b.id.peer)).to.be.true;

      // Take peer-A offline:
      a.sync.enabled = false;
      await Time.wait(100);

      expect(sFired.length).to.eql(3);
      expect(aFired.length).to.eql(2);
      expect(bFired.length).to.eql(1);
      expect(sFired.map((e) => e.type).slice(-1)).to.eql(['network/peer-offline']);
      expect(aFired.map((e) => e.type).slice(-1)).to.eql(['network/peer-offline']);
      expect(bFired.map((e) => e.type).slice(-1)).to.eql(['network/peer-online']); // NB: no knowledge of the other peer.

      // Bring peer-A back online:
      a.sync.enabled = true;
      await Time.wait(100);

      expect(sFired.length).to.eql(4);
      expect(aFired.length).to.eql(3);
      expect(bFired.length).to.eql(1);

      type On = t.CrdtNetworkPeerOnline;
      type Off = t.CrdtNetworkPeerOffline;
      expect((sFired.slice(-1)[0].payload as On).peerId).to.eql(a.id.peer);
      expect((aFired.slice(-1)[0].payload as On).peerId).to.eql(s.repo.id.peer);

      // Take the server offline (lose connection):
      await s.dispose();
      await Time.wait(100);

      expect(sFired.length).to.eql(4); // NB: no change
      expect(aFired.length).to.eql(4);
      expect(bFired.length).to.eql(2);

      expect(aFired.map((e) => e.type).slice(-1)).to.eql(['network/peer-offline']);
      expect(bFired.map((e) => e.type).slice(-1)).to.eql(['network/peer-offline']);
      expect((aFired.slice(-1)[0].payload as Off).peerId).to.eql(s.repo.id.peer);
      expect((bFired.slice(-1)[0].payload as Off).peerId).to.eql(s.repo.id.peer);

      // Finish up.
      await a.dispose();
      await b.dispose();
    });
  });
});
