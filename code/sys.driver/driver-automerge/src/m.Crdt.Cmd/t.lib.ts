import { type t } from './common.ts';

/**
 * CRDT command RPC library surface.
 */
export type CrdtCmdLib = {
  /**
   * Low-level factory for command instances.
   * The returned instance exposes `.client(port)` / `.host(port, handlers)`.
   */
  make(): t.CrdtCmdInstance;

  /**
   * Derive a command client from a CRDT repo.
   *
   * - If `repo` is worker-backed (`CrdtRepoWorkerProxy`), this uses the
   *   hidden `MessagePort` already associated with the repo.
   * - If `repo` is local/in-process, this creates a synthetic MessageChannel
   *   and binds a host to the real repo, so the client behaves identically.
   */
  // fromRepo(repo: t.CrdtRepo): t.CrdtCmdClient;
};
