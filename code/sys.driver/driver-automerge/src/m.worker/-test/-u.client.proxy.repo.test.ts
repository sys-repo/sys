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
import { CrdtIs } from '../common.ts';
import { CrdtWorker } from '../mod.ts';
import { getRepoPort } from '../u.client.proxy.repo.ts';
import { Wire } from '../u.wire.ts';
import { createTestHelpers } from './u.ts';

type O = Record<string, unknown>;

describe('CrdtWorker.Client.repo (shim)', { sanitizeResources: false, sanitizeOps: false }, () => {
  const Test = createTestHelpers();
  afterEach(Test.reset);

  describe('smoke', () => {
    it('smoke: real repo over MessagePort → stream/open + ready + live', async () => {
      const { port1, port2 } = Test.makePorts();
      const real = Test.realRepo();

      const client = CrdtWorker.Client.repo(port1);
      const { events, stop } = Test.collectRepoEvents(port1);

      CrdtWorker.Host.attach(port2, real);

      // stream/open first
      await Schedule.waitFor(() => events.length >= 1);
      expect(events[0]).to.eql({ type: 'stream/open', payload: {} });

      // at least one ready; client resolves
      await Schedule.waitFor(() => events.some((e) => e.type === 'props/change'));
      await client.whenReady();
      expect(client.status.ready).to.eql(true);

      stop();
      await real.dispose();
      await client.dispose();
    });

    it('client mirrors id from props/snapshot', async () => {
      const client = Test.clientRepo();
      const real = Test.realRepo();

      CrdtWorker.Host.attach(client.port2, real);
      await Schedule.waitFor(() => Obj.hash(client.repo.id) === Obj.hash(real.id));

      expect(client.repo.id.instance).to.eql(real.id.instance);
      expect(client.repo.id.peer).to.eql(real.id.peer);

      await client.repo.dispose();
      await real.dispose();
    });
  });

  describe('lifecycle', () => {
    it('create → dispose: no timer leaks', async () => {
      const { port1, port2 } = Test.makePorts();
      const realRepo = Test.realRepo();

      CrdtWorker.Host.attach(port2, realRepo);
      const proxyRepo = CrdtWorker.Client.repo(port1);

      // Cleanup:
      await proxyRepo.dispose();
      await realRepo.dispose();
    });

    it('disposing of host worker-repo causes proxy-repo to dispose', async () => {
      const test = async (awaitWhenReady: boolean) => {
        const { port1, port2 } = Test.makePorts();
        const realRepo = Test.realRepo();
        CrdtWorker.Host.attach(port2, realRepo);
        const proxyRepo = CrdtWorker.Client.repo(port1);
        if (awaitWhenReady) await proxyRepo.whenReady();

        expect(realRepo.disposed).to.eql(false);
        expect(proxyRepo.disposed).to.eql(false);

        await realRepo.dispose();
        await Schedule.waitFor(() => proxyRepo.disposed);

        expect(realRepo.disposed).to.eql(true);
        expect(proxyRepo.disposed).to.eql(true);

        // Final cleanup.
        await proxyRepo.dispose();
      };

      await test(false);
      await test(true);
    });
  });

  describe('core invariants', () => {
    it('exposes a t.CrdtRepo surface (structural typing)', async () => {
      const { port1 } = Test.makePorts();
      const repo = CrdtWorker.Client.repo(port1);
      // Type-level: should be assignable to t.CrdtRepo
      expectTypeOf(repo).toMatchTypeOf<t.CrdtRepo>();
      await repo.dispose();
    });

    it('branding: via === "worker-proxy" (stable discriminant)', async () => {
      const { port1 } = Test.makePorts();
      const repo = CrdtWorker.Client.repo(port1);
      expect((repo as t.CrdtRepoWorkerProxy).via).to.eql('worker-proxy');
      await repo.dispose();
    });

    it('lifecycle: dispose emits once, sets disposed, and is idempotent', async () => {
      const { port1 } = Test.makePorts();
      const repo = CrdtWorker.Client.repo(port1);

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
      const repo = CrdtWorker.Client.repo(port1, { until });
      expect(repo.disposed).to.eql(false);

      until.dispose();
      expect(repo.disposed).to.eql(false);
      await Schedule.micro();
      expect(repo.disposed).to.eql(true);
    });

    it('status mirrors latest props.status (default: stalled=false)', async () => {
      const { port1 } = Test.makePorts();
      const repo = CrdtWorker.Client.repo(port1) as t.CrdtRepoWorkerProxy;

      // Before any props, status should be a benign default.
      const initialStatus = repo.status;
      expect(initialStatus.stalled).to.eql(false);

      // Drive a props/snapshot into the shim.
      const props: t.CrdtRepoProps = {
        status: { ready: true, stalled: true },
        id: { instance: 'repo-x' as t.StringId, peer: 'peer-x' as t.StringId },
        sync: { peers: [], urls: [], enabled: false },
        stores: [],
      };

      const msg: t.WireMessage = {
        version: CrdtWorker.version,
        type: 'event',
        stream: Wire.Kind.repo,
        event: { type: 'props/snapshot', payload: props },
      };

      port1.dispatchEvent(new MessageEvent('message', { data: msg }));
      await Schedule.micro();

      const status = repo.status;
      expect(status.stalled).to.eql(true);

      await repo.dispose();
    });

    it('port is retrieval from repo/proxy instance', async () => {
      const { port1 } = Test.makePorts();
      const repo = CrdtWorker.Client.repo(port1) as t.CrdtRepoWorkerProxy;
      expect(getRepoPort(repo)).to.equal(port1);
      await repo.dispose();
    });
  });

  describe('props/change (shim → prop$)', () => {
    it('emits prop$ with {prop,before,after} and mirrors client state', async () => {
      const { port1, port2 } = Test.makePorts();
      const client = CrdtWorker.Client.repo(port1);

      // collect events from the shim
      const until = Rx.lifecycle();
      const propsEvents: t.CrdtRepoPropChangeEvent['payload'][] = [];
      const repoEvents: t.CrdtRepoEvent[] = [];
      const events = client.events(until);

      events.prop$.subscribe((e) => propsEvents.push(e));
      events.$.subscribe((e) => repoEvents.push(e));

      // craft a wire props/change
      const before: t.CrdtRepoProps = {
        status: { ready: true, stalled: false },
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
      await Schedule.waitFor(() => propsEvents.length === 1);
      const payload = propsEvents[0];

      // NB: after the status refactor, the shim now normalizes this to a 'status' prop
      expect(payload.prop).to.eql('status');
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

      await Schedule.waitFor(() => repoEvents.length === 1);
      const evt$ = repoEvents[0];
      expect(evt$.type).to.eql('props/change');
      expect(evt$.payload).to.eql(payload);

      until.dispose();
      await client.dispose();
    });

    it('does not toggle ready$ for non-status prop changes', async () => {
      const { port1, port2 } = Test.makePorts();
      const client = CrdtWorker.Client.repo(port1);

      const until = Rx.lifecycle();
      const readies: boolean[] = [];
      client.events(until).ready$.subscribe((r) => readies.push(r));

      const base: t.CrdtRepoProps = {
        status: { ready: false, stalled: false },
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
      await Schedule.micro();

      // Because no status.ready transition occurred:
      expect(readies).to.eql([]); // ➜ Should remain empty
      expect(readies.length).to.eql(0);

      until.dispose();
      await client.dispose();
    });
  });

  describe('network events', () => {
    it('forwards wire network events → client.events().network$ (and $)', async () => {
      const { port1 } = Test.makePorts();
      const client = CrdtWorker.Client.repo(port1);

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
      await Schedule.waitFor(() => networkEvents.length >= 1);

      const first = networkEvents[0]!;
      expect(first.type).to.eql('network/peer-online');
      if (first.type === 'network/peer-online') {
        expect(first.payload.peerId).to.eql('peer-1');
      }

      await Schedule.waitFor(() => repoEvents.length >= 1);
      const first$ = repoEvents[0]!;
      expect(first$.type).to.eql('network/peer-online');
      if (first$.type === 'network/peer-online') {
        expect(first$.payload.peerId).to.eql('peer-1');
      }

      until.dispose();
      await client.dispose();
    });
  });

  describe('rpc', () => {
    describe('rpc: sync.enable', () => {
      it('forwards sync.enable calls from client to worker repo', async () => {
        const { port1, port2 } = Test.makePorts();
        const real = Test.realRepo();

        /**
         * Spy on the real repo's sync.enable, while preserving original behavior.
         */
        const calls: (boolean | undefined)[] = [];
        const sync = real.sync;
        const originalEnable = sync.enable.bind(sync);

        sync.enable = ((enabled?: boolean) => {
          calls.push(enabled);
          return originalEnable(enabled);
        }) as typeof sync.enable;

        const client = CrdtWorker.Client.repo(port1);

        // Bind worker side to port2.
        CrdtWorker.Host.attach(port2, real);

        // Ensure client is ready so we know wiring is live.
        await client.whenReady();

        // Act: invoke enable with various inputs.
        client.sync.enable(true);
        client.sync.enable(false);
        client.sync.enable(); // implicit true

        // Wait for calls to land on the worker side.
        await Schedule.waitFor(() => calls.length >= 3);

        expect(calls).to.eql<[boolean | undefined, boolean | undefined, boolean | undefined]>([
          true,
          false,
          undefined, // implicit case: enabled? argument omitted
        ]);

        // Wait for all pending RPC handlers to complete before disposal
        await Schedule.tick();

        await client.dispose();
        await real.dispose();
      });
    });

    describe('rpc: create', () => {
      it('routes create calls to the worker repo and returns the new id', async () => {
        const { port1, port2 } = Test.makePorts();
        const real = Test.realRepo();

        // Bind the worker-side repo to port2.
        CrdtWorker.Host.attach(port2, real);

        // Known initial value we expect to be stored in the created doc.
        const initial = { foo: 'bar' };

        // Craft a raw wire call for "create".
        const wireId: t.WireId = 1;
        const call: t.WireRepoCall<'create'> = {
          version: CrdtWorker.version,
          type: 'call',
          id: wireId,
          method: 'create',
          args: [initial],
        };

        // Capture the result message returned over the port.
        const results: t.WireResult[] = [];
        const onMessage = (ev: MessageEvent) => {
          const msg = ev.data as t.WireMessage | undefined;
          if (msg?.type === 'result') results.push(msg);
        };

        port1.addEventListener('message', onMessage);
        port1.start?.();

        // Act: send the call into the worker.
        port1.postMessage(call);

        // Wait for a result to come back.
        await Schedule.waitFor(() => results.length >= 1);

        const result = results[0] as t.WireRepoResultOk<'create'>;

        // Wire-level assertions.
        expect(result.ok).to.eql(true);
        expect(result.id).to.eql(wireId);

        const data = result.data as t.WireRepoCreateResult;
        const createdId = data.id;

        expect(createdId).to.be.a('string');
        expect(createdId.length).to.be.greaterThan(0);

        // End-to-end sanity: the real repo should now have a doc with that id + value.
        const created = await real.get<typeof initial>(createdId);
        expect(created.ok).to.eql(true);
        expect(created.error).to.eql(undefined);
        expect(created.doc).to.exist;
        expect(created.doc!.current).to.eql(initial);

        // Cleanup.
        port1.removeEventListener('message', onMessage);
        await real.dispose();
      });
    });

    describe('rpc: get', () => {
      it('forwards repo.get via RPC and returns a worker-proxy ref', async () => {
        type Doc = { foo: string };
        const { port1, port2 } = Test.makePorts();
        const real = Test.realRepo();

        // Seed a real document so get(id) is valid.
        const realDoc = (await real.create<Doc>({ foo: 'hello' })).doc!;

        /**
         * Spy on the real repo's get, while preserving original behavior.
         */
        const calls: { id: t.StringId; options?: t.CrdtRepoGetOptions }[] = [];
        const originalGet = real.get.bind(real);

        real.get = (async <T extends O>(id: t.StringId, options?: t.CrdtRepoGetOptions) => {
          calls.push({ id, options });
          return originalGet<T>(id, options);
        }) as typeof real.get;

        const client = CrdtWorker.Client.repo(port1);

        // Bind worker side to port2.
        CrdtWorker.Host.attach(port2, real);

        // Ensure client is ready so we know wiring is live.
        await client.whenReady();

        const id = realDoc.id;
        const options: t.CrdtRepoGetOptions = { timeout: 250 as t.Msecs };

        const result = await client.get<Doc>(id, options);

        // Assert the worker's get was invoked with the same arguments.
        expect(calls.length).to.eql(1);
        expect(calls[0]?.id).to.eql(id);
        expect(calls[0]?.options).to.eql(options);

        // And the client sees a worker-proxy ref, not the raw wire shape.
        expect(result.error).to.eql(undefined);
        expect(result.doc).to.exist;

        if (result.doc) {
          expect(result.doc.id).to.eql(id);
          expect(CrdtIs.proxy(result.doc)).to.eql(true);
        }

        await client.dispose();
        await real.dispose();
      });

      describe('errors', () => {
        it('propagates repo.get domain errors via response.error (ok === true)', async () => {
          const { port1, port2 } = Test.makePorts();
          const real = Test.realRepo();

          /**
           * Spy on the real repo's get and make it return a domain-level error,
           * not throw. This should come back to the client as `result.error`.
           */
          const calls: { id: t.StringId; options?: t.CrdtRepoGetOptions }[] = [];
          const originalGet = real.get.bind(real);

          real.get = (async <T extends O>(id: t.StringId, options?: t.CrdtRepoGetOptions) => {
            calls.push({ id, options });

            const error = {
              kind: 'Timeout' as t.CrdtRepoErrorKind,
              message: 'took too long',
            } as t.CrdtRepoError;

            const result: t.CrdtRefResult<T> = { ok: false, error };
            return result;
          }) as typeof real.get;

          const client = CrdtWorker.Client.repo(port1);

          CrdtWorker.Host.attach(port2, real);
          await client.whenReady();

          const id = 'doc-err' as t.StringId;
          const options: t.CrdtRepoGetOptions = { timeout: 123 as t.Msecs };

          const result = await client.get<{ foo: string }>(id, options);

          // Worker called with the same args.
          expect(calls.length).to.eql(1);
          expect(calls[0]?.id).to.eql(id);
          expect(calls[0]?.options).to.eql(options);

          // Domain error comes back on the happy path response.
          expect(result.doc).to.eql(undefined);
          expect(result.error).to.exist;
          expect(result.error?.kind).to.eql<'Timeout'>('Timeout');
          expect(result.error?.message).to.eql('took too long');

          await client.dispose();
          await real.dispose();

          // Restore for future tests.
          real.get = originalGet;
        });

        it('wraps thrown repo.get errors as WireError (client rejects)', async () => {
          const { port1, port2 } = Test.makePorts();
          const real = Test.realRepo();

          const originalGet = real.get.bind(real);

          const thrown = {
            kind: 'Timeout' as t.CrdtRepoErrorKind,
            message: 'boom',
          } as t.CrdtRepoError;

          real.get = (async () => {
            throw thrown;
          }) as typeof real.get;

          const client = CrdtWorker.Client.repo(port1);

          CrdtWorker.Host.attach(port2, real);
          await client.whenReady();

          let caught: t.WireError | undefined;

          try {
            await client.get<{ foo: string }>('doc-err' as t.StringId);
          } catch (err) {
            caught = err as t.WireError;
          }

          expect(caught).to.exist;
          if (caught) {
            // kind/message preserved through Wire.errFrom + Wire.err → rpc() rejection.
            expect(caught.kind).to.eql<'Timeout'>('Timeout');
            expect(caught.message).to.eql('boom');
          }

          await client.dispose();
          await real.dispose();

          real.get = originalGet;
        });
      });
    });

    describe('rpc: delete', () => {
      it('forwards delete calls from client to worker repo', async () => {
        const { port1, port2 } = Test.makePorts();
        const real = Test.realRepo();

        /**
         * Spy on the real repo's delete, while preserving signature.
         */
        const calls: t.StringId[] = [];
        const originalDelete = real.delete.bind(real);

        real.delete = (async (id: t.StringId | t.Crdt.Ref) => {
          calls.push(id as t.StringId); // in this test we only pass a string
          // We don't need to call the original; avoiding side-effects is fine here.
        }) as typeof real.delete;

        const client = CrdtWorker.Client.repo(port1);

        // Wire the worker side to port2.
        CrdtWorker.Host.attach(port2, real);

        // Ensure the client is ready so RPC is live.
        await client.whenReady();

        // Act: invoke delete on the client shim.
        const id = 'doc-1' as t.StringId;
        await client.delete(id);

        // Wait for the call to land on the worker side.
        await Schedule.waitFor(() => calls.length >= 1);

        expect(calls).to.eql<[t.StringId]>([id]);

        await client.dispose();
        await real.dispose();
      });
    });
  });
});
