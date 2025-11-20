import type { t, WIRE_VERSION } from './common.ts';

/**
 * Type surface for the web-worker transport layer of the CRDT repo.
 * Defines the contract used by both the main-thread client and worker host.
 */
export type CrdtWorkerLib = {
  /** Protocol version tag for all CRDT wire messages. */
  readonly version: typeof WIRE_VERSION;

  /** Creates a worker-backed `t.CrdtRepo` client facade on the main thread. */
  repo(port: MessagePort, opts?: { until?: t.UntilInput; stalledAfter?: t.Msecs }): t.CrdtRepo;

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
 * Factor that produces a repository.
 */
export type CrdtRepoFactory = (args: {
  config?: t.CrdtWorkerSpawnConfig;
}) => t.CrdtRepo | Promise<t.CrdtRepo>;

/** Options for `Crdt.Worker.spawn` */
export type CrdtWorkerSpawnOptions = {
  worker?: WorkerOptions;
  config?: t.CrdtWorkerSpawnConfig;
  until?: t.UntilInput;
};
