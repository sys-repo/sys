import { attachHandlers } from '../m.Crdt.Cmd/u.attachHandlers.ts';
import { type t, CrdtIs, Is } from './common.ts';
import { makeAttachHandler } from './u.host.cmd.makeAttachHandler.ts';

import { Wire } from './u.wire.ts';

type AttachMessage = {
  kind?: string;
  port?: MessagePort;
};

/**
 * Install worker-side wiring for CRDT repo events.
 *
 * Supports two worker-host patterns:
 * - listen(self, repo)           ← existing repo instance
 * - listen(self, factory)        ← lazy repo creation with spawn-time config
 */
export const listen: t.CrdtWorkerHostLib['listen'] = (self, args, opts = {}) => {
  let { repo, factory } = wrangle.args(args);

  /**
   * Message handler: look for `crdt:attach` and bind the provided port.
   * If a factory was provided, lazily create the repo on first attach via the
   * typed `attach` command with access to the optional spawn-time config.
   */
  self.addEventListener('message', (ev) => {
    const data = ev.data as AttachMessage | undefined;
    if (!data) return;
    if (data.kind !== Wire.Kind.attach) return;

    const port = ev.ports?.[0] ?? data.port;
    if (!port) return;

    /**
     * Bind the RPC command host to the MessagePort.
     */
    const attach = makeAttachHandler({ port, repo, factory }, (created) => (repo = created));
    attachHandlers({
      endpoint: port,
      repo: () => repo,
      handlers: { attach },
    });
  });

  /**
   * Signal to `CrdtWorker.Client.spawn` that this worker has installed its
   * message handler and is ready to accept a `crdt:attach` port.
   */
  if (Is.func(self.postMessage)) self.postMessage({ kind: Wire.Kind.workerReady });
};

/**
 * Helpers:
 */
const wrangle = {
  args(input: t.CrdtRepo | t.CrdtRepoFactory) {
    const factory = Is.func(input) ? input : undefined;
    const repo = CrdtIs.repo(input) ? input : undefined;
    return { factory, repo } as const;
  },
} as const;
