import { type t } from './common.ts';

/**
 * Worker-level command RPC.
 */
export type CrdtWorkerCmdLib = {
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
export type CrdtWorkerCmdInstance = t.CmdInstance<
  t.CrdtWorkerCmdName,
  t.CrdtWorkerCmdPayload,
  t.CrdtWorkerCmdResult
>;

/**
 * Command names supported by the CRDT worker.
 * Currently a single handshake command: 'attach'.
 */
export type CrdtWorkerCmdName = 'attach';

/**
 * Payloads keyed by command name.
 * - attach → optional spawn-time configuration.
 */
export type CrdtWorkerCmdPayload = {
  attach: { config?: t.CrdtWorkerSpawnConfig };
};

/**
 * Result payloads keyed by command name.
 * - attach → simple success acknowledgement.
 */
export type CrdtWorkerCmdResult = {
  attach: { ok: true };
};
