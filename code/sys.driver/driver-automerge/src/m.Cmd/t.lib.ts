import type { t } from './common.ts';

/**
 * CRDT command RPC API.
 */
export type CrdtCmdLib = {
  /**
   * Low-level factory for command instances.
   * The returned instance exposes `.client(port)` / `.host(port, handlers)`.
   */
  make(): t.CrdtCmdFactory;

  /**
   * Attach a command host for the given repo to a command endpoint.
   *
   * Exposes the CRDT command set of methods over any transport
   * that satisfies `t.Cmd.Endpoint` (MessagePort, WebSocket, etc).
   */
  attachHost(repo: t.CrdtRepo, endpoint: t.Cmd.Endpoint, until?: t.UntilInput): t.Cmd.Host.Handle;

  /**
   * Derive a command client from a CRDT repo.
   *
   * - If `repo` is worker-backed (`CrdtRepoWorkerProxy`), this uses the
   *   hidden `MessagePort` already associated with the repo.
   * - If `repo` is local/in-process, this creates a synthetic MessageChannel
   *   and binds a host to the real repo, so the client behaves identically.
   */
  fromRepo(repo: t.CrdtRepo, until?: t.UntilInput): t.CrdtCmdClient;
};
