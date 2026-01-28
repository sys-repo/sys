import { type t, CrdtIs, Is } from './common.ts';
import { Wire } from '../m.worker/u.wire.ts';
import { attach } from './u.host.attach.ts';
import { make } from './u.make.ts';

/**
 * Doc-level commands handler factory (reuse from m.Cmd.commands).
 */
import {
  makeDocCreateHandler,
  makeDocReadHandler,
  makeDocSaveHandler,
  makeDocStatsHandler,
  makeDocWriteHandler,
} from '../m.Cmd.commands/mod.ts';
import { make as makeCrdtCmd } from '../m.Cmd/u.make.ts';

type AttachMessage = {
  kind?: string;
  port?: MessagePort;
};

/**
 * Install worker-side wiring for CRDT repo events using Cmd-based RPC.
 *
 * Supports two worker-host patterns:
 * - listen(self, repo)           ← existing repo instance
 * - listen(self, factory)        ← lazy repo creation with spawn-time config
 */
export const listen: t.CrdtWorkerCmdHostLib['listen'] = (self, args) => {
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
     * Bind Cmd-based RPC host to the MessagePort.
     * Uses hybrid approach: Cmd for RPC, direct postMessage for events.
     */
    const getRepo = () => repo;
    const crdtCmd = makeCrdtCmd();

    /**
     * Create the attach handler that lazily creates repo if needed.
     */
    const attachHandler = async ({ config }: { config?: t.CrdtWorkerConfig }) => {
      const ok: t.CrdtCmdResult['attach'] = { ok: true };

      // Repo already exists.
      if (repo) {
        attach(port, repo);
        return ok;
      }

      // Lazily create repo via factory on first attach.
      if (factory) {
        const created = await factory({ config });
        repo = created;

        // If this is a filesystem-based worker with a publish config,
        // start the WebSocket command server for this repo.
        if (config?.kind === 'fs' && config.publish) {
          if (Is.browser()) throw new Error(`Cannot load an "fs" configuration in the browser`);
          const { publishCommands } = await import('../m.worker/u.host.publishCommands.ts');
          const { port: wsPort, hostname } = config.publish;
          publishCommands({ repo, port: wsPort, hostname });
        }

        attach(port, created);
        return ok;
      }

      // No repo or factory available.
      return ok;
    };

    /**
     * Set up doc-level command handlers (for doc:create, doc:read, etc.)
     */
    const handlers: t.CrdtCmdHandlers = {
      attach: attachHandler,
      'doc:create': makeDocCreateHandler(getRepo),
      'doc:read': makeDocReadHandler(getRepo),
      'doc:write': makeDocWriteHandler(getRepo),
      'doc:stats': makeDocStatsHandler(getRepo),
      'doc:save': makeDocSaveHandler(getRepo),
    };

    crdtCmd.host(port, handlers);
  });

  /**
   * Signal to `CrdtWorkerCmd.Client.spawn` that this worker has installed its
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
