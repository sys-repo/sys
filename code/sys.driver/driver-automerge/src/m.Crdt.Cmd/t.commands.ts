import type { t } from './common.ts';

type Name = t.CrdtCmdName;
type Payload = t.CrdtCmdPayload;
type Result = t.CrdtCmdResult;

/**
 * Command names supported by the CRDT command layer.
 */
export type CrdtCmdName = 'attach' | 'stats' | 'fs:save';

/**
 * Payloads keyed by command name.
 * - attach → optional spawn-time configuration.
 * - stats  → document id to inspect.
 */
export type CrdtCmdPayload = {
  attach: { config?: t.CrdtWorkerSpawnConfig };
  stats: { doc: t.Crdt.Id };
  'fs:save': { doc: t.Crdt.Id; path: t.StringPath };
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
  attach: CrdtCommands.AttachResult;
  stats: t.DocumentStats;
  'fs:save': CrdtCommands.SaveResult;
};

/**
 * Types related to the commands.
 */
export namespace CrdtCommands {
  export type AttachResult = { ok: true };
  export type SaveResult = {
    ok: true;
    bytes: t.NumberBytes;
    path: t.StringPath;
    hash: t.StringHash;
  };
}
