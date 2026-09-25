import { WebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';
import { describe, expect, it, Rx, Time } from '../../-test.ts';
import { toAutomergeRepo } from '../mod.ts';
import { EventsFixture } from './u.fixture.events.ts';

describe(
  'CrdtRepo.events.prop$',
  {
    // @automerge/automerge-repo-network-websocket@2.5.6 owns uncancellable readiness/reconnect
    // timers. Deno 2.9 reports these timers while either signal is enabled; the fixture still
    // closes every client repo, socket server, and resource, and exit policy stays active.
    sanitizeOps: false,
    sanitizeResources: false,
  },
  () => {
    it('reconnect → disable while CONNECTING closes without an uncaught error', async () => {
      const fx = await EventsFixture.network();

      try {
        const { repo } = fx.createRepo();
        await repo.whenReady();
        const adapter = toAutomergeRepo(repo)?.networkSubsystem.adapters[0];
        if (!(adapter instanceof WebSocketClientAdapter)) throw new Error('Expected WS adapter');

        repo.sync.enable(false);
        await EventsFixture.waitFor(() => adapter.socket === undefined);

        const connect = adapter.connect.bind(adapter);
        let connecting = false;
        let closed = false;
        adapter.connect = (peerId, metadata) => {
          connect(peerId, metadata);
          const socket = adapter.socket;
          if (!socket) throw new Error('Expected reconnect socket');
          connecting = socket.readyState === socket.CONNECTING;
          socket.addEventListener('close', () => (closed = true), { once: true });
          // Disable before returning control to network IO, not after an arbitrary sleep.
          repo.sync.enable(false);
        };

        repo.sync.enable(true);
        await EventsFixture.waitFor(() => closed);
        expect(connecting).to.eql(true);
        expect(adapter.socket).to.eql(undefined);
        expect(repo.sync.enabled).to.eql(false);
        expect(repo.sync.peers).to.eql([]);
      } finally {
        await fx.dispose();
      }
    });

    it('initial connection → dispose closes a CONNECTING socket', async () => {
      const fx = await EventsFixture.network();

      try {
        const { repo } = fx.createRepo();
        const adapter = toAutomergeRepo(repo)?.networkSubsystem.adapters[0];
        if (!(adapter instanceof WebSocketClientAdapter)) throw new Error('Expected WS adapter');
        let closed = false;
        await EventsFixture.connecting(adapter);
        const socket = adapter.socket;
        if (!socket) throw new Error('Expected initial socket');
        expect(socket.readyState).to.eql(socket.CONNECTING);
        socket.addEventListener('close', () => (closed = true), { once: true });

        await repo.dispose();
        await EventsFixture.waitFor(() => closed);
        expect(repo.disposed).to.eql(true);
        expect(adapter.socket).to.eql(undefined);
      } finally {
        await fx.dispose();
      }
    });

    it('queued handshake abort → dispose closes a CLOSING socket', async () => {
      const fx = await EventsFixture.network();

      try {
        const { repo } = fx.createRepo();
        const adapter = toAutomergeRepo(repo)?.networkSubsystem.adapters[0];
        if (!(adapter instanceof WebSocketClientAdapter)) throw new Error('Expected WS adapter');
        await EventsFixture.connecting(adapter);
        const socket = adapter.socket;
        if (!socket) throw new Error('Expected initial socket');
        expect(socket.readyState).to.eql(socket.CONNECTING);
        let closed = false;
        socket.addEventListener('close', () => (closed = true), { once: true });

        socket.close();
        expect(socket.readyState).to.eql(socket.CLOSING);
        await repo.dispose();
        await EventsFixture.waitFor(() => closed);
        expect(socket.listenerCount('error')).to.eql(0);
        expect(socket.listenerCount('close')).to.eql(0);
        expect(repo.disposed).to.eql(true);
      } finally {
        await fx.dispose();
      }
    });

    it('initial connect failure → rejects with its cause and cleans up the fixture', async () => {
      const fx = await EventsFixture.network();
      const { repo } = fx.createRepo();
      const failure = new Error('test: connect failed');
      let caught: unknown;

      try {
        const adapter = toAutomergeRepo(repo)?.networkSubsystem.adapters[0];
        if (!(adapter instanceof WebSocketClientAdapter)) throw new Error('Expected WS adapter');
        const failConnect = () => {
          throw failure;
        };
        adapter.connect = failConnect;
        try {
          await EventsFixture.connecting(adapter, 100);
        } catch (error) {
          caught = error;
        }
        expect(adapter.connect).to.equal(failConnect);
      } finally {
        await fx.dispose();
      }

      expect(caught).to.equal(failure);
      expect(repo.disposed).to.eql(true);
      expect(fx.server.disposed).to.eql(true);
    });

    it('missing initial connect → times out and restores the adapter', async () => {
      const adapter = new WebSocketClientAdapter('ws://localhost');
      const connect = adapter.connect;
      let caught: unknown;
      try {
        await EventsFixture.connecting(adapter, 10);
      } catch (error) {
        caught = error;
      }
      expect(caught).to.be.instanceOf(Error);
      expect(caught).to.have.property('message', 'Timed out waiting for adapter.connect()');
      expect(adapter.connect).to.equal(connect);
      expect(adapter.socket).to.eql(undefined);
    });

    it('sync.enabled (toggle)', async () => {
      const fx = await EventsFixture.network();

      try {
        const a = fx.createRepo();
        const repo = a.repo;
        await repo.whenReady(); // avoid racing adapter bring-up

        const next = () => Rx.firstValueFrom(a.events.prop$.pipe(Rx.take(1)));

        // 1) disable → expect one prop-change
        const p1 = next();
        repo.sync.enable(false);
        const e1 = await p1;

        expect(e1.before.id).to.eql(e1.after.id);
        expect(e1.before.sync.urls).to.eql(e1.after.sync.urls);
        expect(e1.before.sync.enabled).to.eql(true);
        expect(e1.after.sync.enabled).to.eql(false);

        // 2) enable → expect second prop-change
        const p2 = next();
        repo.sync.enable(true);
        const e2 = await p2;

        expect(e2.before.sync.enabled).to.eql(false);
        expect(e2.after.sync.enabled).to.eql(true);

        // 3) no-op toggle shouldn’t emit
        const fired: (typeof e1)[] = [];
        const sub = a.events.prop$.subscribe((e) => fired.push(e));
        repo.sync.enable();
        await Time.delay(); // one microtask hop
        expect(fired.length).to.eql(0);
        sub.unsubscribe();

        // 4) after dispose, no more events
        a.events.dispose();
        repo.sync.enable(false);
        await Time.delay();
        expect(fired.length).to.eql(0);
      } finally {
        await fx.dispose();
      }
    });

    it('sync.peers', async () => {
      const fx = await EventsFixture.network();

      try {
        const { server } = fx;
        const a = fx.createRepo();
        const b = fx.createRepo();

        expect(server.repo.sync.peers).to.eql([]);
        expect(a.repo.sync.peers).to.eql([]);
        expect(b.repo.sync.peers).to.eql([]);

        // Wait for initial peer connections:
        await EventsFixture.waitFor(
          () =>
            EventsFixture.hasPeer(a.repo, server.repo.id.peer) &&
            EventsFixture.hasPeer(b.repo, server.repo.id.peer) &&
            EventsFixture.hasPeer(server.repo, a.repo.id.peer) &&
            EventsFixture.hasPeer(server.repo, b.repo.id.peer) &&
            EventsFixture.peerChanges(a).length >= 1 &&
            EventsFixture.peerChanges(b).length >= 1,
        );
        expect(a.repo.sync.peers).to.eql([server.repo.id.peer]);
        expect(b.repo.sync.peers).to.eql([server.repo.id.peer]);
        expect(server.repo.sync.peers).to.have.members([a.repo.id.peer, b.repo.id.peer]);

        const initialA = EventsFixture.peerChanges(a);
        const initialB = EventsFixture.peerChanges(b);
        expect(initialA.length).to.eql(1);
        expect(initialB.length).to.eql(1);

        expect(initialA[0].before.sync.peers).to.eql([]);
        expect(initialA[0].after.sync.peers).to.eql([server.repo.id.peer]);
        expect(initialB[0].before.sync.peers).to.eql([]);
        expect(initialB[0].after.sync.peers).to.eql([server.repo.id.peer]);

        // Take A offline:
        const aBeforeOffline = EventsFixture.peerChanges(a).length;
        const bBeforeOffline = EventsFixture.peerChanges(b).length;
        a.repo.sync.enable(false);
        await EventsFixture.waitFor(
          () =>
            a.repo.sync.peers.length === 0 &&
            EventsFixture.hasPeer(b.repo, server.repo.id.peer) &&
            server.repo.sync.peers.length === 1 &&
            EventsFixture.hasPeer(server.repo, b.repo.id.peer) &&
            EventsFixture.peerChanges(a).length > aBeforeOffline,
        );
        expect(a.repo.sync.peers).to.eql([]);
        expect(b.repo.sync.peers).to.eql([server.repo.id.peer]);
        expect(server.repo.sync.peers).to.eql([b.repo.id.peer]);
        expect(EventsFixture.peerChanges(b).length).to.eql(bBeforeOffline);

        // Only check peer-change events (ignore ready, enabled, etc.):
        const lastPeerA = EventsFixture.peerChanges(a).slice(-1)[0];
        const lastPeerB = EventsFixture.peerChanges(b).slice(-1)[0];
        expect(lastPeerA.before.sync.peers).to.eql([server.repo.id.peer]);
        expect(lastPeerA.after.sync.peers).to.eql([]);
        expect(lastPeerB.before.sync.peers).to.eql([]);
        expect(lastPeerB.after.sync.peers).to.eql([server.repo.id.peer]);

        // Bring A back online:
        const aBeforeOnline = EventsFixture.peerChanges(a).length;
        a.repo.sync.enable();
        await EventsFixture.waitFor(
          () =>
            EventsFixture.hasPeer(a.repo, server.repo.id.peer) &&
            EventsFixture.hasPeer(b.repo, server.repo.id.peer) &&
            EventsFixture.hasPeer(server.repo, a.repo.id.peer) &&
            EventsFixture.hasPeer(server.repo, b.repo.id.peer) &&
            EventsFixture.peerChanges(a).length > aBeforeOnline,
        );
        expect(a.repo.sync.peers).to.eql([server.repo.id.peer]);
        expect(b.repo.sync.peers).to.eql([server.repo.id.peer]);
        expect(server.repo.sync.peers).to.have.members([a.repo.id.peer, b.repo.id.peer]);

        const backOnlineA = EventsFixture.peerChanges(a).slice(-1)[0];
        expect(backOnlineA.before.sync.peers).to.eql([]);
        expect(backOnlineA.after.sync.peers).to.eql([server.repo.id.peer]);

        // Kill the server:
        const aBeforeServerOffline = EventsFixture.peerChanges(a).length;
        const bBeforeServerOffline = EventsFixture.peerChanges(b).length;
        await server.dispose();
        await EventsFixture.waitFor(
          () =>
            a.repo.sync.peers.length === 0 &&
            b.repo.sync.peers.length === 0 &&
            server.repo.sync.peers.length === 0 &&
            EventsFixture.peerChanges(a).length > aBeforeServerOffline &&
            EventsFixture.peerChanges(b).length > bBeforeServerOffline,
        );
        expect(a.repo.sync.peers).to.eql([]);
        expect(b.repo.sync.peers).to.eql([]);
        expect(server.repo.sync.peers).to.eql([]);

        const finalPeerA = EventsFixture.peerChanges(a).slice(-1)[0];
        const finalPeerB = EventsFixture.peerChanges(b).slice(-1)[0];
        expect(finalPeerA.before.sync.peers).to.eql([server.repo.id.peer]);
        expect(finalPeerA.after.sync.peers).to.eql([]);
        expect(finalPeerB.before.sync.peers).to.eql([server.repo.id.peer]);
        expect(finalPeerB.after.sync.peers).to.eql([]);
      } finally {
        await fx.dispose();
      }
    });
  },
);
