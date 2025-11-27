import type { t } from './common.ts';

type Name = t.CrdtCmdName;
type Payload = t.CrdtCmdPayload;
type Result = t.CrdtCmdResult;

/**
 * Command names supported by the CRDT command layer.
 */
export type CrdtCmdName = 'attach' | 'fs:save' | 'doc:stats' | 'doc:read';

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
 * - stats        → document id to inspect.
 * - fs:save      → persist document to a file path.
 * - doc:read     → fetch a document by id.
 */
export type CrdtCmdPayload = {
  attach: { config?: t.CrdtWorkerConfig };
  'fs:save': { doc: t.Crdt.Id; path: t.StringPath };
  'doc:read': { doc: t.Crdt.Id };
  'doc:stats': { doc: t.Crdt.Id };
};

/**
 * Result payloads keyed by command name.
 * - attach       → simple success acknowledgement.
 * - stats        → document statistics.
 * - fs:save      → file-system save result.
 * - doc:read  → document reference (if present).
 */
export type CrdtCmdResult = {
  attach: CrdtCommands.AttachResult;
  'fs:save': CrdtCommands.SaveResult;
  'doc:read': CrdtCommands.GetDocResult;
  'doc:stats': t.DocumentStats;
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
