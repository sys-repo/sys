import type { t } from './common.ts';

type Name = t.CrdtCmdName;
type Payload = t.CrdtCmdPayload;
type Result = t.CrdtCmdResult;

/**
 * Command names supported by the CRDT command layer.
 */
export type CrdtCmdName = 'attach' | 'stats';

/**
 * Payloads keyed by command name.
 * - attach → optional spawn-time configuration.
 * - stats  → document id to inspect.
 */
export type CrdtCmdPayload = {
  attach: { config?: t.CrdtWorkerSpawnConfig };
  stats: { doc: t.Crdt.Id };
};

/**
 * Typed set of worker-side command handlers.
 *
 * For each command name:
 *   handler(args) → result | Promise<result>
 */
export type CrdtCmdHandlers = t.CmdHandlers<Name, Payload, Result>;

/**
 * Result payloads keyed by command name.
 * - attach → simple success acknowledgement.
 * - stats  → document statistics.
 */
export type CrdtCmdResult = {
  attach: { ok: true };
  stats: t.DocumentStats;
};
