import {
  type t,
  Obj,
  Rx,
  Schedule,
  afterEach,
  describe,
  expect,
  expectTypeOf,
  it,
} from '../../-test.ts';
import { CrdtWorker } from '../mod.ts';
import { Wire } from '../u.wire.ts';
import { Wait, createTestHelpers } from './u.ts';

describe('CrdtWorker.repo (shim)', () => {
  const Test = createTestHelpers();
  afterEach(Test.reset);

  describe('smoke', () => {
    it('smoke: real repo over MessagePort → stream/open + ready + live', async () => {
      const { port1, port2 } = Test.makePorts();
      const real = Test.realRepo();

      const client = CrdtWorker.repo(port1);
      const { events, stop } = Test.collectRepoEvents(port1);

      CrdtWorker.attach(port2, real);

      // stream/open first
      await Wait.waitFor(() => events.length >= 1);
      expect(events[0]).to.eql({ type: 'stream/open', payload: {} });

      // at least one ready; client resolves
      await Wait.waitFor(() => events.some((e) => e.type === 'ready'));
      await client.whenReady();
      expect(client.ready).to.eql(true);

      stop();
      await real.dispose();
      await client.dispose();
    });

    it('client mirrors id from props/snapshot', async () => {
      const client = Test.clientRepo();
      const real = Test.realRepo();

      CrdtWorker.attach(client.port2, real);
      await Wait.waitFor(() => Obj.hash(client.repo.id) === Obj.hash(real.id));

      expect(client.repo.id.instance).to.eql(real.id.instance);
      expect(client.repo.id.peer).to.eql(real.id.peer);

      await real.dispose();
    });
  });

  describe('construct (core invariants)', () => {
    it('exposes a t.CrdtRepo surface (structural typing)', async () => {
      const { port1, port2 } = Test.makePorts();
      const repo = CrdtWorker.repo(port1);
      // Type-level: should be assignable to t.CrdtRepo
      expectTypeOf(repo).toMatchTypeOf<t.CrdtRepo>();

      repo.dispose();
    });

    it('branding: via === "worker" (stable discriminant)', () => {
      const { port1 } = Test.makePorts();
      const repo = CrdtWorker.repo(port1);
      expect((repo as t.CrdtRepoWorkerShim).via).to.eql('worker-proxy');
    });

    it('lifecycle: dispose emits once, sets disposed, and is idempotent', async () => {
      const { port1 } = Test.makePorts();
      const repo = CrdtWorker.repo(port1);

      const fired: t.DisposeAsyncEvent[] = [];
      repo.dispose$.subscribe((e) => fired.push(e));
      expect(repo.disposed).to.eql(false);

      await repo.dispose();
      expect(repo.disposed).to.eql(true);
      expect(fired.map((e) => e.payload.stage)).to.eql(['start', 'complete']);

      // Idempotent:
      await repo.dispose();
      expect(repo.disposed).to.eql(true);
      expect(fired.length).to.eql(2);
    });

    it('lifecycle: dispose via `until` parameter option', async () => {
      const until = Rx.lifecycle();

      const { port1 } = Test.makePorts();
      const repo = CrdtWorker.repo(port1, { until });
      expect(repo.disposed).to.eql(false);

      until.dispose();
      expect(repo.disposed).to.eql(false);
      await Schedule.micro();
      expect(repo.disposed).to.eql(true);
    });
  });

  describe('props/change (shim → prop$)', () => {
    it('emits prop$ with {prop,before,after} and mirrors client state', async () => {
      const { port1, port2 } = Test.makePorts();
      const client = CrdtWorker.repo(port1);

      // collect events from the shim
      const until = Rx.lifecycle();
      const propsEvents: t.CrdtRepoPropChangeEvent['payload'][] = [];
      const repoEvents: t.CrdtRepoEvent[] = [];
      const events = client.events(until);

      events.prop$.subscribe((e) => propsEvents.push(e));
      events.$.subscribe((e) => repoEvents.push(e));

      // craft a wire props/change
      const before: t.CrdtRepoProps = {
        ready: true,
        id: { instance: 'inst-1' as t.StringId, peer: 'peer-1' as t.StringId },
        sync: { peers: [], urls: [], enabled: false },
        stores: [],
      };
      const after: t.CrdtRepoProps = {
        ...before,
        sync: { peers: ['p2' as t.PeerId], urls: ['wss://x' as t.StringUrl], enabled: true },
      };

      const evt: t.WireMessage = {
        version: CrdtWorker.version,
        type: 'event',
        stream: 'crdt:repo',
        event: { type: 'props/change', payload: { prop: 'sync.peers', before, after } },
      };

      // drive the client by posting from the other end of the channel
      port2.postMessage(evt);

      // assert: prop$ fired once with cloned payload
      await Wait.waitFor(() => propsEvents.length === 1);
      const payload = propsEvents[0];

      expect(payload.prop).to.eql('sync.peers');
      expect(payload.before).to.eql(before);
      expect(payload.after).to.eql(after);

      // ensure arrays are defensively cloned (no shared refs)
      expect(payload.after.sync.peers).to.not.equal(after.sync.peers);
      expect(payload.after.sync.urls).to.not.equal(after.sync.urls);
      expect(payload.after.stores).to.not.equal(after.stores);

      // client mirrors AFTER state via getters
      expect(client.id).to.eql(after.id);
      expect(client.sync.enabled).to.eql(true);
      expect(client.sync.peers).to.eql(after.sync.peers);
      expect(client.sync.urls).to.eql(after.sync.urls);

      await Wait.waitFor(() => repoEvents.length === 1);
      const evt$ = repoEvents[0];
      expect(evt$.type).to.eql('props/change');
      expect(evt$.payload).to.eql(payload);

      until.dispose();
      await client.dispose();
    });

    it('does not toggle ready$ for non-ready prop changes', async () => {
      const { port1, port2 } = Test.makePorts();
      const client = CrdtWorker.repo(port1);

      const until = Rx.lifecycle();
      const readies: boolean[] = [];
      client.events(until).ready$.subscribe((r) => readies.push(r));

      const base: t.CrdtRepoProps = {
        ready: false,
        id: { instance: 'i' as t.StringId, peer: 'p' as t.StringId },
        sync: { peers: [], urls: [], enabled: false },
        stores: [],
      };

      const evt: t.WireMessage = {
        version: CrdtWorker.version,
        type: 'event',
        stream: 'crdt:repo',
        event: {
          type: 'props/change',
          payload: {
            prop: 'sync.enabled',
            before: base,
            after: { ...base, sync: { ...base.sync, enabled: true } },
          },
        },
      };

      port2.postMessage(evt);

      // allow microtask turn for subscriptions to process
      await Schedule.micro();

      // ready$ should still be only the initial value (false) and not flip
      // (BehaviorSubject emits the seed once)
      expect(readies[0]).to.eql(false);
      expect(readies.length).to.eql(1);

      until.dispose();
      await client.dispose();
    });
  });

  describe('network events', () => {
    it('forwards wire network events → client.events().network$ (and $)', async () => {
      const { port1 } = Test.makePorts();
      const client = CrdtWorker.repo(port1);

      const until = Rx.lifecycle();
      const networkEvents: t.CrdtNetworkChangeEvent[] = [];
      const repoEvents: t.CrdtRepoEvent[] = [];
      const events = client.events(until);

      events.network$.subscribe((e) => networkEvents.push(e));
      events.$.subscribe((e) => repoEvents.push(e));

      // Craft a wire-level network event (peer-online).
      const payload: t.CrdtNetworkPeerOnlineEvent = {
        type: 'network/peer-online',
        payload: { peerId: 'peer-1' as t.PeerId },
      };

      const msg: t.WireMessage = {
        version: CrdtWorker.version,
        type: 'event',
        stream: Wire.Kind.repo,
        event: payload,
      };

      // Push the message into the same MessagePort the shim is listening on.
      port1.dispatchEvent(new MessageEvent('message', { data: msg } as MessageEventInit));

      // Wait for the shim to see and forward it.
      await Wait.waitFor(() => networkEvents.length >= 1);

      const first = networkEvents[0]!;
      expect(first.type).to.eql('network/peer-online');
      if (first.type === 'network/peer-online') {
        expect(first.payload.peerId).to.eql('peer-1');
      }

      await Wait.waitFor(() => repoEvents.length >= 1);
      const first$ = repoEvents[0]!;
      expect(first$.type).to.eql('network/peer-online');
      if (first$.type === 'network/peer-online') {
        expect(first$.payload.peerId).to.eql('peer-1');
      }

      until.dispose();
      await client.dispose();
    });
  });
});
