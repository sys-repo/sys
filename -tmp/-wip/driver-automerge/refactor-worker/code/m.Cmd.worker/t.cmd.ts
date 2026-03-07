import type { t } from './common.ts';

/**
 * Command names supported by the worker-level CRDT command layer.
 * These are repo-level RPC operations replacing the bespoke wire protocol.
 */
export type WorkerCmdName =
  | 'repo:ready'
  | 'repo:create'
  | 'repo:get'
  | 'repo:delete'
  | 'repo:sync.enable';

/**
 * Typed set of worker-side command handlers.
 */
export type WorkerCmdHandlers = t.CmdHandlers<WorkerCmdName, WorkerCmdPayload, WorkerCmdResult>;

/**
 * Payloads keyed by command name.
 */
export type WorkerCmdPayload = {
  'repo:ready': Record<never, never>;
  'repo:create': { initial: unknown };
  'repo:get': { id: t.StringId; options?: t.CrdtRepoGetOptions };
  'repo:delete': { id: t.StringId };
  'repo:sync.enable': { enabled?: boolean };
};

/**
 * Result payloads keyed by command name.
 */
export type WorkerCmdResult = {
  'repo:ready': { ready: true };
  'repo:create': { id: t.StringId };
  'repo:get': { doc?: { id: t.StringId }; error?: t.CrdtRepoError };
  'repo:delete': { deleted: true };
  'repo:sync.enable': { enabled: boolean | null };
};
