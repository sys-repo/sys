import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';
import { Crdt } from '@sys/driver-automerge/fs';

import { type t } from '../common.ts';
import { CrdtWorker } from '../m.CrdtWorker.ts';

type O = Record<string, unknown>;

/**
 * Common test utilities for worker-based CRDT repo.
 */
export function createTestHelpers() {
  const ports = new Set<MessagePort>();
  const api = {
    /**
     * Close all tracked MessagePorts.
     */
    reset() {
      ports.forEach((p) => p.close());
      ports.clear();
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
        repo: CrdtWorker.repo(port1),
      } as const;
    },

    /**
     * Create a real CrdtRepo with optional WebSocket network adapter.
     */
    realRepo(opts: { network?: boolean } = {}) {
      const network: t.CrdtFsNetworkArgInput[] = [];
      const url = 'wss://sync.automerge.org';
      if (opts.network) network.push(new BrowserWebSocketClientAdapter(url));
      return Crdt.repo({ network });
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
      CrdtWorker.listen(fakeSelf, repo);
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

      CrdtWorker.attach(port2, realRepo);
      const proxyRepo = await CrdtWorker.repo(port1).whenReady();
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
