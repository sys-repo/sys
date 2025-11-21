import { type t } from './common.ts';

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
