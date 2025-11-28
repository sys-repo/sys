import type { t } from './common.ts';

type O = Record<string, unknown>;
type Name = t.CrdtCmdName;
type Payload = t.CrdtCmdPayload;
type Result = t.CrdtCmdResult;

/**
 * Command names supported by the CRDT command layer.
 */
export type CrdtCmdName = 'attach' | 'doc:read' | 'doc:write' | 'doc:stats' | 'doc:save';

/**
 * Typed set of worker-side command handlers.
 *
 * For each command name:
 *   handler(args) → result | Promise<result>
 */
export type CrdtCmdHandlers = t.CmdHandlers<Name, Payload, Result>;

/**
 * Payloads keyed by command name.
 * - attach       → optional spawn-time configuration.
 * - doc:read     → fetch a document by id.
 * - doc:write    → write a document value by path
 * - doc:stats    → document id to inspect.
 * - doc:save     → persist document to a file path.
 */
export type CrdtCmdPayload = {
  attach: { config?: t.CrdtWorkerConfig };
  'doc:read': { doc: t.Crdt.Id; path?: t.ObjectPath };
  'doc:write': { doc: t.Crdt.Id; value: t.Json; path: t.ObjectPath };
  'doc:stats': { doc: t.Crdt.Id };
  'doc:save': { doc: t.Crdt.Id; path: t.StringPath };
};

/**
 * Result payloads keyed by command name.
 * - attach       → simple success acknowledgement.
 * - doc:read     → document reference (if present).
 * - doc:write    → document reference (if present).
 * - doc:stats    → document statistics.
 * - doc:save     → file-system save result.
 */
export type CrdtCmdResult = {
  attach: t.CrdtCommands.AttachResult;
  'doc:read': t.CrdtCommands.DocReadResult;
  'doc:write': t.CrdtCommands.DocWriteResult;
  'doc:stats': t.CrdtCommands.DocStatsResult;
  'doc:save': t.CrdtCommands.DocSaveResult;
};

/**
 * Types related to the commands.
 */
export namespace CrdtCommands {
  export type AttachResult = { readonly ok: true };
  export type DocReadResult = { readonly value?: t.Json };
  export type DocWriteResult = { readonly ok: true };
  export type DocStatsResult = t.DocumentStats;
  export type DocSaveResult = {
    readonly ok: true;
    readonly bytes: t.NumberBytes;
    readonly path: t.StringPath;
    readonly hash: t.StringHash;
  };
}
