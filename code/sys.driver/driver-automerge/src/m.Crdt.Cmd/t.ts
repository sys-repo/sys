import type { t } from './common.ts';

type Name = t.CrdtWorkerCmdName;
type Payload = t.CrdtWorkerCmdPayload;
type Result = t.CrdtWorkerCmdResult;

/**
 * CRDT command RPC.
 */
export type CrdtCmdLib = {
  make(): t.CrdtWorkerCmdInstance;
};

/**
 * Fully-typed command set for CRDT worker control.
 *
 * - `send('attach', { config })` → `{ ok: true }`
 *
 * Instances are produced by `Crdt.Worker.Cmd.make()` and expose:
 *   - `.client(port)` → command client bound to a MessagePort
 *   - `.host(port, handlers)` → handler-side command host
 */
export type CrdtWorkerCmdInstance = t.CmdInstance<Name, Payload, Result>;

/**
 * Typed set of worker-side command handlers.
 *
 * For each command name:
 *   handler(args) → result | Promise<result>
 */
export type CrdtWorkerCmdHandlers = t.CmdHandlers<Name, Payload, Result>;

/**
 * Command names supported by the CRDT worker.
 * Currently a single handshake command: 'attach'.
 */
export type CrdtWorkerCmdName = 'attach' | 'stats';

/**
 * Payloads keyed by command name.
 * - attach → optional spawn-time configuration.
 */
export type CrdtWorkerCmdPayload = {
  attach: { config?: t.CrdtWorkerSpawnConfig };
  stats: { doc: t.Crdt.Id };
};

/**
 * Result payloads keyed by command name.
 * - attach → simple success acknowledgement.
 */
export type CrdtWorkerCmdResult = {
  attach: { ok: true };
  stats: t.DocumentStats;
};
