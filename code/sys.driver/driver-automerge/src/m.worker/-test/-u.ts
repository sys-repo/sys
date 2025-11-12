import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';
import { Crdt } from '@sys/driver-automerge/fs';

import { type t, Schedule } from '../common.ts';
import { CrdtWorker } from '../m.CrdtWorker.ts';

const createAdapters = () => {
  const net1 = new BrowserWebSocketClientAdapter('wss://sync.automerge.org');
  const net2 = new BrowserWebSocketClientAdapter('wss://sync.db.team');
  return { net1, net2 } as const;
};

/**
 * Common test utilities for worker-based CRDT repo.
 */
export function createTestHelpers() {
  const ports = new Set<MessagePort>();

  const api = {
    clearPorts() {
      ports.forEach((p) => p.close());
      ports.clear();
    },

    makePorts() {
      const channel = new MessageChannel();
      ports.add(channel.port1);
      ports.add(channel.port2);
      return channel;
    },

    clientRepo() {
      const { port1, port2 } = api.makePorts();
      return {
        port1,
        port2,
        repo: CrdtWorker.repo(port1),
      } as const;
    },

    realRepo(opts: { network?: boolean } = {}) {
      const network: t.CrdtFsNetworkArgInput[] = [];
      if (opts.network) {
        network.push(new BrowserWebSocketClientAdapter('wss://sync.automerge.org'));
      }
      return Crdt.repo({ network });
    },

    collectRepoEvents(port: MessagePort) {
      const events: t.WireRepoEventPayload[] = [];
      const onMessage = (e: MessageEvent) => {
        const msg = e.data as t.WireEvent;
        if (msg?.type === 'event' && msg.stream === 'crdt:repo') events.push(msg.event);
      };
      port.addEventListener('message', onMessage);
      port.start?.(); // required in Deno to start delivery
      return {
        events,
        stop: () => port.removeEventListener('message', onMessage),
      };
    },
  };

  return api;
}

/**
 * Wait helpers:
 */
export const Wait = {
  /** Flush a single MessagePort delivery cycle (macro) then microtasks. */
  async tick() {
    await Schedule.macro(); // MessageChannel deliveries land on the task (macro) queue
    await Schedule.micro(); // drain follow-on microtasks scheduled by handlers
  },

  /** Flush N cycles. */
  async flush(rounds = 2) {
    for (let i = 0; i < rounds; i++) await Wait.tick();
  },

  async waitFor(pred: () => boolean, timeoutMs = 1500) {
    const deadline = Date.now() + timeoutMs;
    await Wait.tick(); // initial settle
    while (Date.now() < deadline) {
      if (pred()) return;
      await Wait.tick();
    }
    throw new Error('waitFor: timeout');
  },
};
