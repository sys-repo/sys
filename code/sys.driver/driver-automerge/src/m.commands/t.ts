import type { t } from './common.ts';

type Name = t.CrdtCmdName;
type Payload = t.CrdtCmdPayload;
type Result = t.CrdtCmdResult;

/**
 * Command names supported by the CRDT command layer.
 */
export type CrdtCmdName = 'attach' | 'stats' | 'fs:save' | 'doc:get';

/**
 * Typed set of worker-side command handlers.
 *
 * For each command name:
 *   handler(args) → result | Promise<result>
 */
export type CrdtCmdHandlers = t.CmdHandlers<Name, Payload, Result>;

/**
 * Payloads keyed by command name.
 * - attach   → optional spawn-time configuration.
 * - stats    → document id to inspect.
 * - fs:save  → persist document to a file path.
 * - doc:get  → fetch a document by id.
 */
export type CrdtCmdPayload = {
  attach: { config?: t.CrdtWorkerConfig };
  stats: { doc: t.Crdt.Id };
  'fs:save': { doc: t.Crdt.Id; path: t.StringPath };
  'doc:get': { doc: t.Crdt.Id };
};

/**
 * Result payloads keyed by command name.
 * - attach   → simple success acknowledgement.
 * - stats    → document statistics.
 * - fs:save  → file-system save result.
 * - doc:get  → document reference (if present).
 */
export type CrdtCmdResult = {
  attach: CrdtCommands.AttachResult;
  stats: t.DocumentStats;
  'fs:save': CrdtCommands.SaveResult;
  'doc:get': CrdtCommands.GetDocResult;
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

  export type GetDocResult = {
    readonly doc?: t.Crdt.Ref | undefined;
  };
}
