import {
  type Message,
  NetworkAdapter,
  type PeerId,
  type PeerMetadata,
} from '@automerge/automerge-repo';
import { Crdt } from '../../-exports/-fs/mod.ts';

import { type t, Time } from '../common.ts';
import { CrdtWorker } from '../m.Worker.ts';

type O = Record<string, unknown>;

class TestNetworkAdapter extends NetworkAdapter {
  readonly url: t.StringUrl;

  constructor(url: t.StringUrl) {
    super();
    this.url = url;
  }

  isReady() {
    return true;
  }

  async whenReady() {}

  connect(peerId: PeerId, peerMetadata?: PeerMetadata) {
    this.peerId = peerId;
    this.peerMetadata = peerMetadata;
  }

  send(_message: Message) {}
  disconnect() {}
}

/**
 * Common test utilities for worker-based CRDT repo.
 */
export function createTestHelpers() {
  const ports = new Set<MessagePort>();
  const repos = new Set<t.CrdtRepo>();
  const api = {
    /**
     * Close all tracked MessagePorts.
     */
    async reset() {
      await Promise.all([...repos].map((repo) => repo.dispose()));
      repos.clear();
      ports.forEach((port) => port.close());
      ports.clear();

      // @automerge/automerge-repo@2.5.6 leaves a non-cancellable 100ms throttle tail.
      await Time.wait(110);
    },

    /**
     * Allocate a MessageChannel and track both ports for cleanup.
     */
    makePorts() {
      const channel = new MessageChannel();
      ports.add(channel.port1);
      ports.add(channel.port2);
      return channel;
    },

    /**
     * Create a client-side CrdtRepo bound to a fresh MessagePort pair.
     */
    clientRepo() {
      const { port1, port2 } = api.makePorts();
      return {
        port1,
        port2,
        repo: CrdtWorker.Client.repo(port1),
      } as const;
    },

    /**
     * Create a real CrdtRepo with an optional timer-free test network adapter.
     */
    realRepo(opts: { network?: boolean } = {}) {
      const network: t.CrdtFs.Network.Input[] = [];
      const url = 'wss://sync.automerge.org' as t.StringUrl;
      if (opts.network) network.push(new TestNetworkAdapter(url));
      const repo = Crdt.repo({ network });
      repos.add(repo);
      return repo;
    },

    /**
     * Collect repo events emitted over a MessagePort.
     */
    collectRepoEvents(port: MessagePort) {
      const events: t.WireRepoEventPayload[] = [];

      const onMessage = (e: MessageEvent) => {
        const msg = e.data as t.WireEvent;
        if (msg?.type === 'event' && msg.stream === 'crdt:repo') {
          events.push(msg.event);
        }
      };

      port.addEventListener('message', onMessage);
      port.start?.(); // required in Deno

      return {
        events,
        stop: () => port.removeEventListener('message', onMessage),
      };
    },

    /**
     * Minimal worker-like scope: routes postMessage → CrdtWorker.listen.
     */
    fakeWorkerLikeScope(repo: t.CrdtRepo) {
      type MessageHandler = (ev: MessageEvent) => void;
      const handlers: MessageHandler[] = [];
      function addEventListener(type: string, handler: MessageHandler) {
        if (type === 'message') handlers.push(handler);
      }
      function postMessage(data: unknown, ports: MessagePort[] = []) {
        const ev = { data, ports } as unknown as MessageEvent;
        handlers.forEach((fn) => fn(ev));
      }
      function terminate() {
        handlers.length = 0;
      }
      const fakeSelf = { addEventListener } as typeof globalThis;
      CrdtWorker.Host.listen(fakeSelf, repo);
      return { postMessage, terminate };
    },

    stubRepoGet<Doc extends O = O>(
      repo: t.CrdtRepo,
      impl: (id: t.StringId, options?: t.CrdtRepoGetOptions) => Promise<t.CrdtRefResult<Doc>>,
    ) {
      const original = repo.get.bind(repo);
      repo.get = impl as typeof repo.get;
      return () => {
        repo.get = original;
      };
    },

    async sample<D extends O = O>(initial: D) {
      const { port1, port2 } = api.makePorts();
      const realRepo = await api.realRepo().whenReady();

      CrdtWorker.Host.attach(port2, realRepo);
      const proxyRepo = await CrdtWorker.Client.repo(port1).whenReady();
      const realDoc = (await realRepo.create<D>(initial)).doc!;

      async function dispose() {
        realDoc.dispose();
        await proxyRepo.dispose();
        await realRepo.dispose();
      }

      return {
        port1,
        port2,
        real: { repo: realRepo, doc: realDoc },
        proxy: { repo: proxyRepo },
        collectRepoEvents() {
          return {
            port1: api.collectRepoEvents(port1),
            port2: api.collectRepoEvents(port2),
          } as const;
        },
        dispose,
      } as const;
    },
  } as const;

  return api;
}
