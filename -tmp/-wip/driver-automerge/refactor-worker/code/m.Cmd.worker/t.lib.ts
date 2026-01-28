import type { t, CMD_VERSION } from './common.ts';

type Name = t.WorkerCmdName;
type Payload = t.WorkerCmdPayload;
type Result = t.WorkerCmdResult;

/**
 * Type surface for the Cmd-based web-worker transport layer of the CRDT repo.
 * Replaces the bespoke wire protocol in m.worker with the generic Cmd system.
 */
export type CrdtWorkerCmdLib = {
  /** Protocol version tag for Cmd-based worker messages. */
  readonly version: typeof CMD_VERSION;

  /** Low-level factory for worker command instances. */
  make(): t.CmdFactory<Name, Payload, Result>;

  /** Main-thread client API (spawn, repo proxy over MessagePort). */
  readonly Client: t.CrdtWorkerCmdClientLib;

  /** Worker-side host API (listen/attach real repos to ports). */
  readonly Host: t.CrdtWorkerCmdHostLib;
};

/**
 * Main-thread surface:
 * used to spawn worker hosts and create worker-backed
 * `CrdtRepo` proxies over a `MessagePort`.
 */
export type CrdtWorkerCmdClientLib = {
  /** Creates a worker-backed `t.CrdtRepo` client facade on the main thread. */
  repo(port: MessagePort, opts?: { until?: t.UntilInput; stalledAfter?: t.Msecs }): t.CrdtRepo;

  /**
   * Spawns a worker and connects to its existing CRDT repo.
   * Establishes a MessageChannel link and returns both the worker handle
   * and the client-side repo facade bound to that connection.
   */
  spawn(
    url: URL | Worker,
    opts?: t.CrdtWorkerSpawnOptions,
  ): Promise<{ readonly worker: Worker; readonly repo: t.CrdtRepo }>;
};

/**
 * Worker-side surface:
 * used inside a web worker to host a real `CrdtRepo`
 * and expose it over a `MessagePort` (listen/attach).
 */
export type CrdtWorkerCmdHostLib = {
  /** Attaches a real repo instance to a `MessagePort` inside the worker. */
  attach(port: MessagePort, repo: t.CrdtRepo): void;

  /**
   * Worker host: listen for `crdt:attach` messages on the worker global scope
   * and bind a repo to the received `MessagePort`.
   *
   * Overloads:
   * - `listen(self, repo)`:
   *     Use an already-created `t.CrdtRepo` instance (legacy/simple path).
   *
   * - `listen(self, factory)`:
   *     Lazily create the repo when the first `crdt:attach` arrives, with
   *     access to the optional spawn-time `config`. The factory may return
   *     the repo synchronously or as a Promise.
   */
  listen(self: typeof globalThis, repo: t.CrdtRepo): void;
  listen(self: typeof globalThis, factory: t.CrdtRepoFactory): void;
};

/**
 * Factory for the typed worker command set.
 * Produced by `CrdtWorkerCmd.make()`.
 */
export type WorkerCmdFactory = t.CmdFactory<Name, Payload, Result>;

/**
 * Command client: `.send(name, payload)` → Promise<result>.
 */
export type WorkerCmdClient = t.CmdClient<Name, Payload, Result>;
