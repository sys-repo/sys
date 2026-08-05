import { describe, expect, it, type t } from '../../-test.ts';
import { EventsFixture } from './u.fixture.events.ts';

describe(
  'CrdtRepo.events.network$',
  {
    // @automerge/automerge-repo-network-websocket@2.5.6 owns uncancellable readiness/reconnect
    // timers. Deno 2.9 reports these timers while either signal is enabled; the fixture still
    // closes every client repo, socket server, and resource, and exit policy stays active.
    sanitizeOps: false,
    sanitizeResources: false,
  },
  () => {
    it('peer-online → peer-offline → network-close', async () => {
      const fx = await EventsFixture.network();

      try {
        const { server, serverLog } = fx;
        const a = fx.createRepo();
        const b = fx.createRepo();

        // Both peers connect (online):
        await EventsFixture.waitFor(
          () =>
            serverLog.network.filter((e) => e.type === 'network/peer-online').length >= 2 &&
            a.network.some(
              (e) => e.type === 'network/peer-online' && e.payload.peerId === server.repo.id.peer,
            ) &&
            b.network.some(
              (e) => e.type === 'network/peer-online' && e.payload.peerId === server.repo.id.peer,
            ),
        );
        expect(serverLog.network.length).to.eql(2);
        expect(serverLog.network.map((e) => e.type)).to.eql([
          'network/peer-online',
          'network/peer-online',
        ]);

        const onlinePeers = serverLog.network.filter((e) => e.type === 'network/peer-online');
        expect(onlinePeers.some((e) => e.payload.peerId === a.repo.id.peer)).to.be.true;
        expect(onlinePeers.some((e) => e.payload.peerId === b.repo.id.peer)).to.be.true;

        // Take peer-A offline:
        const sBeforeOffline = serverLog.network.length;
        const aBeforeOffline = a.network.length;
        a.repo.sync.enable(false);
        await EventsFixture.waitFor(
          () =>
            serverLog.network.length > sBeforeOffline &&
            a.network.length > aBeforeOffline &&
            a.repo.sync.peers.length === 0 &&
            EventsFixture.hasPeer(server.repo, b.repo.id.peer) &&
            !EventsFixture.hasPeer(server.repo, a.repo.id.peer),
        );

        expect(serverLog.network.length).to.eql(3);
        expect(a.network.length).to.eql(2);
        expect(b.network.length).to.eql(1);
        expect(serverLog.network.map((e) => e.type).slice(-1)).to.eql(['network/peer-offline']);
        expect(a.network.map((e) => e.type).slice(-1)).to.eql(['network/peer-offline']);
        expect(b.network.map((e) => e.type).slice(-1)).to.eql(['network/peer-online']); // NB: no knowledge of the other peer.

        // Bring peer-A back online:
        const sBeforeOnline = serverLog.network.length;
        const aBeforeOnline = a.network.length;
        a.repo.sync.enable();
        await EventsFixture.waitFor(
          () =>
            serverLog.network.length > sBeforeOnline &&
            a.network.length > aBeforeOnline &&
            EventsFixture.hasPeer(a.repo, server.repo.id.peer) &&
            EventsFixture.hasPeer(server.repo, a.repo.id.peer) &&
            EventsFixture.hasPeer(server.repo, b.repo.id.peer),
        );

        expect(serverLog.network.length).to.eql(4);
        expect(a.network.length).to.eql(3);
        expect(b.network.length).to.eql(1);

        type On = t.CrdtNetworkPeerOnline;
        type Off = t.CrdtNetworkPeerOffline;
        expect((serverLog.network.slice(-1)[0].payload as On).peerId).to.eql(a.repo.id.peer);
        expect((a.network.slice(-1)[0].payload as On).peerId).to.eql(server.repo.id.peer);

        // Take the server offline (lose connection):
        const sBeforeServerOffline = serverLog.network.length;
        const aBeforeServerOffline = a.network.length;
        const bBeforeServerOffline = b.network.length;
        await server.dispose();
        await EventsFixture.waitFor(
          () =>
            a.network.length > aBeforeServerOffline &&
            b.network.length > bBeforeServerOffline &&
            a.repo.sync.peers.length === 0 &&
            b.repo.sync.peers.length === 0,
        );

        expect(serverLog.network.length).to.eql(sBeforeServerOffline); // NB: no change
        expect(a.network.length).to.eql(4);
        expect(b.network.length).to.eql(2);

        expect(a.network.map((e) => e.type).slice(-1)).to.eql(['network/peer-offline']);
        expect(b.network.map((e) => e.type).slice(-1)).to.eql(['network/peer-offline']);
        expect((a.network.slice(-1)[0].payload as Off).peerId).to.eql(server.repo.id.peer);
        expect((b.network.slice(-1)[0].payload as Off).peerId).to.eql(server.repo.id.peer);
      } finally {
        await fx.dispose();
      }
    });
  },
);
