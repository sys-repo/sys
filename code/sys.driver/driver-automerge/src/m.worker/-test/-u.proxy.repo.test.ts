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

type O = Record<string, unknown>;

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
      await Wait.waitFor(() => events.some((e) => e.type === 'props/change'));
      await client.whenReady();
      expect(client.status.ready).to.eql(true);

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

      await client.repo.dispose();
      await real.dispose();
    });

    it('create → dispose: no timer leaks', async () => {
      const { port1, port2 } = Test.makePorts();
      const realRepo = Test.realRepo();

      CrdtWorker.attach(port2, realRepo);
      const proxyRepo = CrdtWorker.repo(port1);

      // Cleanup:
      await proxyRepo.dispose();
      await realRepo.dispose();
    });
  });

  describe('core invariants', () => {
    it('exposes a t.CrdtRepo surface (structural typing)', async () => {
      const { port1 } = Test.makePorts();
      const repo = CrdtWorker.repo(port1);
      // Type-level: should be assignable to t.CrdtRepo
      expectTypeOf(repo).toMatchTypeOf<t.CrdtRepo>();
      await repo.dispose();
    });

    it('branding: via === "worker-proxy" (stable discriminant)', async () => {
      const { port1 } = Test.makePorts();
      const repo = CrdtWorker.repo(port1);
      expect((repo as t.CrdtRepoWorkerShim).via).to.eql('worker-proxy');
      await repo.dispose();
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

    it('status mirrors latest props.status (default: stalled=false)', async () => {
      const { port1 } = Test.makePorts();
      const repo = CrdtWorker.repo(port1) as t.CrdtRepoWorkerShim;

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
      await Wait.waitFor(() => propsEvents.length === 1);
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

      await Wait.waitFor(() => repoEvents.length === 1);
      const evt$ = repoEvents[0];
      expect(evt$.type).to.eql('props/change');
      expect(evt$.payload).to.eql(payload);

      until.dispose();
      await client.dispose();
    });

    it('does not toggle ready$ for non-status prop changes', async () => {
      const { port1, port2 } = Test.makePorts();
      const client = CrdtWorker.repo(port1);

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

        const client = CrdtWorker.repo(port1);

        // Bind worker side to port2.
        CrdtWorker.attach(port2, real);

        // Ensure client is ready so we know wiring is live.
        await client.whenReady();

        // Act: invoke enable with various inputs.
        client.sync.enable(true);
        client.sync.enable(false);
        client.sync.enable(); // implicit true

        // Wait for calls to land on the worker side.
        await Wait.waitFor(() => calls.length >= 3);

        expect(calls).to.eql<[boolean | undefined, boolean | undefined, boolean | undefined]>([
          true,
          false,
          undefined, // implicit case: enabled? argument omitted
        ]);

        await client.dispose();
        await real.dispose();
      });
    });

    describe('rpc: create', () => {
      it('routes create calls to the worker repo and returns the new id', async () => {
        const { port1, port2 } = Test.makePorts();
        const real = Test.realRepo();

        // Spy on the real repo's create, but avoid spinning up real refs/timers.
        const calls: unknown[] = [];
        const fakeId = 'doc-from-test' as t.StringId;

        const originalCreate = real.create.bind(real);
        real.create = ((initial: any) => {
          calls.push(initial);

          // Return a minimal, timer-free stub ref.
          const ref = { id: fakeId } as unknown as t.CrdtRef<typeof initial>;
          return ref;
        }) as typeof real.create;

        // Attach worker side.
        CrdtWorker.attach(port2, real);

        // Prepare a known initial value.
        const initial = { foo: 'bar' };

        // Craft a raw wire call for "create".
        const id: t.WireId = 1;
        const call: t.WireCall<'create'> = {
          version: CrdtWorker.version,
          type: 'call',
          id,
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
        await Wait.waitFor(() => results.length >= 1);
        const result = results[0] as t.WireResultOk<'create'>;

        expect(result.ok).to.eql(true);
        expect(result.id).to.eql(id);

        // The payload should be the create result with an id.
        const data = result.data as t.WireRepoCreateResult;
        expect(data.id).to.eql(fakeId);

        // And the worker should have called create with our initial object.
        expect(calls).to.eql([initial]);

        port1.removeEventListener('message', onMessage);
        await real.dispose();

        // Optional: restore in case this helper is reused in future tests.
        real.create = originalCreate;
      });
    });

    describe('rpc: get', () => {
      it('forwards repo.get via RPC and returns the worker result', async () => {
        const { port1, port2 } = Test.makePorts();
        const real = Test.realRepo();

        /**
         * Spy on the real repo's get, while preserving original behavior.
         */
        const calls: { id: t.StringId; options?: t.CrdtRepoGetOptions }[] = [];
        const originalGet = real.get.bind(real);

        real.get = (async <T extends O>(id: t.StringId, options?: t.CrdtRepoGetOptions) => {
          calls.push({ id, options });

          // Minimal deterministic payload – we only care that it round-trips.
          const result: t.CrdtRefGetResponse<T> = { doc: {} as unknown as t.CrdtRef<T> };

          return result;
        }) as typeof real.get;

        const client = CrdtWorker.repo(port1);

        // Bind worker side to port2.
        CrdtWorker.attach(port2, real);

        // Ensure client is ready so we know wiring is live.
        await client.whenReady();

        const id = 'doc-1' as t.StringId;
        const options: t.CrdtRepoGetOptions = { timeout: 250 as t.Msecs };

        const result = await client.get<{ foo: string }>(id, options);

        // Assert the worker's get was invoked with the same arguments.
        expect(calls.length).to.eql(1);
        expect(calls[0]?.id).to.eql(id);
        expect(calls[0]?.options).to.eql(options);

        // And the client sees exactly what the worker returned.
        expect(result.error).to.eql(undefined);
        expect(result.doc).to.exist;

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

            const result: t.CrdtRefGetResponse<T> = { error };
            return result;
          }) as typeof real.get;

          const client = CrdtWorker.repo(port1);

          CrdtWorker.attach(port2, real);
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

          const client = CrdtWorker.repo(port1);

          CrdtWorker.attach(port2, real);
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

        const client = CrdtWorker.repo(port1);

        // Wire the worker side to port2.
        CrdtWorker.attach(port2, real);

        // Ensure the client is ready so RPC is live.
        await client.whenReady();

        // Act: invoke delete on the client shim.
        const id = 'doc-1' as t.StringId;
        await client.delete(id);

        // Wait for the call to land on the worker side.
        await Wait.waitFor(() => calls.length >= 1);

        expect(calls).to.eql<[t.StringId]>([id]);

        await client.dispose();
        await real.dispose();
      });
    });
  });
});
