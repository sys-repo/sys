import { Crdt } from '@sys/driver-automerge/fs';

import { type t, Schedule } from '../common.ts';
import { CrdtWorker } from '../m.CrdtWorker.ts';

/**
 * Common test utilities for worker-based CRDT repo.
 */
export function workerTestHelpers() {
  const ports = new Set<MessagePort>();

  const api = {
    clear() {
      ports.forEach((p) => p.close());
      ports.clear();
    },

    ports() {
      const channel = new MessageChannel();
      ports.add(channel.port1);
      ports.add(channel.port2);
      return channel;
    },

    repo() {
      const { port1, port2 } = api.ports();
      return { repo: CrdtWorker.repo(port1), port2 } as const;
    },

    realRepo() {
      return Crdt.repo().whenReady();
    },

    /** Flush a single MessagePort delivery cycle (macro) then microtasks. */
    async tick() {
      await Schedule.macro(); // MessageChannel deliveries land on the task (macro) queue
      await Schedule.micro(); // drain follow-on microtasks scheduled by handlers
    },

    /** Flush N cycles. */
    async flush(rounds = 2) {
      for (let i = 0; i < rounds; i++) await api.tick();
    },

    async waitFor(pred: () => boolean, timeoutMs = 1500) {
      const deadline = Date.now() + timeoutMs;
      await api.tick(); // initial settle
      while (Date.now() < deadline) {
        if (pred()) return;
        await api.tick();
      }
      throw new Error('waitFor: timeout');
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
